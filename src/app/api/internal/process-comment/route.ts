import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PADDLE_PLANS } from '@/lib/paddle'

export async function POST(req: NextRequest) {
  // 1. Verify INTERNAL_API_SECRET header
  const secret = req.headers.get('x-internal-api-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { eventId, postId, threadsPostId, likerThreadsId, userId, commentId, commentText } = body

  if (!eventId || !postId || !threadsPostId || !likerThreadsId || !userId || !commentId || !commentText) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // Get monitored post details
    const { data: postRow, error: postError } = await supabaseAdmin
      .from('monitored_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !postRow) {
      throw new Error(`Monitored post not found: ${postError?.message}`)
    }

    // Get profile of the post owner
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`)
    }

    const isBypass = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === 'true'
    const userPlan = isBypass ? 'scale' : (profile.plan || 'free')
    const planConfig = PADDLE_PLANS[userPlan]
    const monthlyLimit = planConfig ? planConfig.messagesLimit : 50

    // Check user plan message limits
    if (profile.messages_sent_this_month >= monthlyLimit) {
      const errorMsg = `Plan monthly limit exceeded: ${profile.messages_sent_this_month}/${monthlyLimit}`
      await supabaseAdmin
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error: errorMsg
        })
        .eq('id', eventId)
      return NextResponse.json({ success: true, message: errorMsg })
    }

    // Fetch commenter profile details from Threads API
    let likerUsername = `threads_user_${likerThreadsId.substring(0, 4)}`
    let likerBio = ''
    let likerFollowers = 0
    let likerThreadsCount = 0

    if (profile.meta_access_token) {
      try {
        const threadsRes = await fetch(
          `https://graph.threads.net/v1.0/${likerThreadsId}?fields=id,username,biography&access_token=${profile.meta_access_token}`
        )
        if (threadsRes.ok) {
          const threadsData = await threadsRes.json()
          likerUsername = threadsData.username || likerUsername
          likerBio = threadsData.biography || ''
        }
      } catch (err) {
        console.error('Failed to fetch Threads profile details, using defaults:', err)
      }
    }

    // Try fetching Instagram profile if available
    let likerInstagramId = null
    if (profile.meta_access_token) {
      try {
        const igRes = await fetch(
          `https://graph.instagram.com/v21.0/${likerThreadsId}?fields=id,username&access_token=${profile.meta_access_token}`
        )
        if (igRes.ok) {
          const igData = await igRes.json()
          likerInstagramId = igData.id
        }
      } catch (err) {
        // Silently catch
      }
    }

    // Save commenter to DB
    const { data: likerRow, error: likerInsertError } = await supabaseAdmin
      .from('likers')
      .insert({
        post_id: postId,
        user_id: userId,
        liker_threads_id: likerThreadsId,
        liker_instagram_id: likerInstagramId,
        liker_username: likerUsername,
        liker_bio: likerBio,
        liker_follower_count: likerFollowers,
        liker_post_count: likerThreadsCount,
        comment_id: commentId,
        comment_text: commentText,
        message_sent: false,
        public_reply_sent: false,
        instagram_dm_sent: false
      })
      .select()
      .single()

    if (likerInsertError) {
      // Unique constraint violation (code 23505)
      if ((likerInsertError as any).code === '23505') {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: 'Duplicate event (commenter already processed)'
          })
          .eq('id', eventId)
        return NextResponse.json({ success: true, message: 'Duplicate comment event skipped' })
      }
      throw likerInsertError
    }

    // 1. Generate BOTH messages from Claude API (one call, two outputs)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const internalSecret = process.env.INTERNAL_API_SECRET || ''

    const genRes = await fetch(`${appUrl}/api/internal/generate-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': internalSecret,
      },
      body: JSON.stringify({
        postId,
        userId,
        likerId: likerRow.id,
        appUrl,
        postContent: postRow.post_content,
        commentText,
        postGoal: postRow.goal,
        customGoalText: postRow.custom_goal_text,
        ctaLink: postRow.cta_link,
        likerUsername,
        likerBio,
        likerFollowerCount: likerFollowers
      })
    })

    if (!genRes.ok) {
      const errText = await genRes.text()
      console.error('Failed to generate messages:', errText)
      throw new Error(`Message generation failed: ${errText}`)
    }

    const { public_reply, private_dm } = await genRes.json()

    // Determine target sending channels based on post channel and plan config
    const allowedChannels = planConfig ? planConfig.channels : ['threads_reply']
    const postChannel = postRow.channel || 'both'

    let shouldSendReply = false
    let shouldSendDm = false

    if (postChannel === 'both') {
      shouldSendReply = allowedChannels.includes('threads_reply')
      shouldSendDm = allowedChannels.includes('instagram_dm')
    } else if (postChannel === 'threads_reply') {
      shouldSendReply = allowedChannels.includes('threads_reply')
    } else if (postChannel === 'instagram_dm') {
      shouldSendDm = allowedChannels.includes('instagram_dm')
    }

    // Fallbacks if no channels matched due to free plan limits
    if (!shouldSendReply && !shouldSendDm) {
      shouldSendReply = allowedChannels.includes('threads_reply')
    }

    let publicReplySentStatus = false
    let instagramDmSentStatus = false
    let messagesSentCount = 0

    // PUNCH 1 — Post public Threads reply
    if (shouldSendReply && public_reply?.text) {
      try {
        const replyRes = await fetch(`${appUrl}/api/internal/send-threads-reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-secret': internalSecret,
          },
          body: JSON.stringify({
            post_owner_threads_id: profile.threads_user_id || profile.id,
            reply_to_id: commentId,
            reply_text: public_reply.text,
            access_token: profile.meta_access_token
          })
        })

        if (replyRes.ok) {
          publicReplySentStatus = true
          messagesSentCount++

          // Save Threads Reply message log
          await supabaseAdmin
            .from('messages_sent')
            .insert({
              liker_id: likerRow.id,
              post_id: postId,
              user_id: userId,
              channel: 'threads_reply',
              message_text: public_reply.text,
              message_version_id: public_reply.version_id,
              was_clicked: false,
              was_converted: false
            })

          // Increment message version times_sent
          const { data: vObj } = await supabaseAdmin
            .from('message_versions')
            .select('times_sent')
            .eq('id', public_reply.version_id)
            .single()

          await supabaseAdmin
            .from('message_versions')
            .update({ times_sent: (vObj?.times_sent || 0) + 1 })
            .eq('id', public_reply.version_id)
        } else {
          console.error('Failed to post Threads reply:', await replyRes.text())
        }
      } catch (err) {
        console.error('Threads reply send error:', err)
      }
    }

    // PUNCH 2 — Send private Instagram DM
    if (shouldSendDm && private_dm?.text) {
      try {
        // Add lead tracking code to the CTA link in DM
        const trackingCta = `${appUrl}/capture?ref=${likerRow.id}&post=${postId}`
        const finalDmText = private_dm.text.replace(postRow.cta_link, trackingCta)

        const dmRes = await fetch(`${appUrl}/api/internal/send-instagram-dm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-secret': internalSecret,
          },
          body: JSON.stringify({
            liker_instagram_id: likerInstagramId || likerThreadsId, // Fallback to threads ID if they match
            messageText: finalDmText,
            meta_access_token: profile.meta_access_token
          })
        })

        if (dmRes.ok) {
          instagramDmSentStatus = true
          messagesSentCount++

          // Save Instagram DM message log
          await supabaseAdmin
            .from('messages_sent')
            .insert({
              liker_id: likerRow.id,
              post_id: postId,
              user_id: userId,
              channel: 'instagram_dm',
              message_text: finalDmText,
              message_version_id: private_dm.version_id,
              was_clicked: false,
              was_converted: false
            })

          // Increment message version times_sent
          const { data: vObj } = await supabaseAdmin
            .from('message_versions')
            .select('times_sent')
            .eq('id', private_dm.version_id)
            .single()

          await supabaseAdmin
            .from('message_versions')
            .update({ times_sent: (vObj?.times_sent || 0) + 1 })
            .eq('id', private_dm.version_id)
        } else {
          console.error('Failed to send Instagram DM:', await dmRes.text())
        }
      } catch (err) {
        console.error('Instagram DM send error:', err)
      }
    }

    // Update commenter's sent statuses in DB
    await supabaseAdmin
      .from('likers')
      .update({
        message_sent: publicReplySentStatus || instagramDmSentStatus,
        message_sent_at: new Date().toISOString(),
        public_reply_sent: publicReplySentStatus,
        instagram_dm_sent: instagramDmSentStatus
      })
      .eq('id', likerRow.id)

    if (messagesSentCount > 0) {
      // Update monitored_posts stats
      const { data: postStats } = await supabaseAdmin
        .from('monitored_posts')
        .select('total_messages_sent, total_likes')
        .eq('id', postId)
        .single()

      await supabaseAdmin
        .from('monitored_posts')
        .update({
          total_messages_sent: (postStats?.total_messages_sent || 0) + messagesSentCount,
          total_likes: (postStats?.total_likes || 0) + 1
        })
        .eq('id', postId)

      // Increment profiles.messages_sent_this_month
      const { data: freshProfile } = await supabaseAdmin
        .from('profiles')
        .select('messages_sent_this_month')
        .eq('id', userId)
        .single()

      await supabaseAdmin
        .from('profiles')
        .update({
          messages_sent_this_month: (freshProfile?.messages_sent_this_month || 0) + messagesSentCount
        })
        .eq('id', userId)
    }

    // Mark webhook_events row as processed
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: messagesSentCount === 0 ? 'No messages were successfully sent' : null
      })
      .eq('id', eventId)

    return NextResponse.json({ success: true, messagesSent: messagesSentCount })
  } catch (err: any) {
    console.error('Process comment failed:', err)
    
    // Log error to webhook event
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: err.message || 'Internal processing error'
      })
      .eq('id', eventId)

    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
