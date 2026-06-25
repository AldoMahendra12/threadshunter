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

  const { eventId, postId, threadsPostId, likerThreadsId, userId } = body

  if (!eventId || !postId || !threadsPostId || !likerThreadsId || !userId) {
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

    const userPlan = profile.plan || 'free'
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

    // Fetch liker profile from Threads API (with retry fallback)
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
    let likerInstagramUsername = ''
    if (profile.meta_access_token) {
      try {
        // Find matching IG user id if exposed via Threads or if we can query Meta Graph
        // For standard setup, we can default to likerThreadsId if connected or check if there is an instagram id.
        // We'll search if Meta returns it. Often Instagram and Threads IDs are linked.
        const igRes = await fetch(
          `https://graph.instagram.com/v21.0/${likerThreadsId}?fields=id,username,biography&access_token=${profile.meta_access_token}`
        )
        if (igRes.ok) {
          const igData = await igRes.json()
          likerInstagramId = igData.id
          likerInstagramUsername = igData.username
        }
      } catch (err) {
        // Silently catch since Instagram ID might not be linked or queried this way
      }
    }

    // Save liker to DB
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
        message_sent: false
      })
      .select()
      .single()

    if (likerInsertError) {
      // If code is 23505 (unique constraint violation), we skip silently
      if ((likerInsertError as any).code === '23505') {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: 'Duplicate event (liker already processed)'
          })
          .eq('id', eventId)
        return NextResponse.json({ success: true, message: 'Duplicate liked event skipped' })
      }
      throw likerInsertError
    }

    // Determine target sending channels based on post channel & plan restrictions
    const channelsToSend: ('threads_comment' | 'instagram_dm')[] = []
    const allowedChannels = planConfig ? planConfig.channels : ['threads_comment']

    if (postRow.channel === 'both') {
      if (allowedChannels.includes('threads_comment')) channelsToSend.push('threads_comment')
      if (allowedChannels.includes('instagram_dm')) {
        // Only send IG DM if we actually have their IG ID
        if (likerInstagramId) {
          channelsToSend.push('instagram_dm')
        } else {
          // If we don't have IG ID, fallback to comment
          if (!channelsToSend.includes('threads_comment') && allowedChannels.includes('threads_comment')) {
            channelsToSend.push('threads_comment')
          }
        }
      }
    } else if (postRow.channel === 'threads_comment' && allowedChannels.includes('threads_comment')) {
      channelsToSend.push('threads_comment')
    } else if (postRow.channel === 'instagram_dm' && allowedChannels.includes('instagram_dm')) {
      if (likerInstagramId) {
        channelsToSend.push('instagram_dm')
      } else if (allowedChannels.includes('threads_comment')) {
        channelsToSend.push('threads_comment') // Fallback to comment
      }
    }

    if (channelsToSend.length === 0) {
      // Force comment fallback for free plan users
      channelsToSend.push('threads_comment')
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const internalSecret = process.env.INTERNAL_API_SECRET || ''

    let messagesSentCount = 0

    // Process each channel
    for (const channel of channelsToSend) {
      // 1. Generate customized message from Claude API
      const genRes = await fetch(`${appUrl}/api/internal/generate-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-secret': internalSecret,
        },
        body: JSON.stringify({
          postId,
          userId,
          postContent: postRow.post_content,
          postGoal: postRow.goal,
          customGoalText: postRow.custom_goal_text,
          ctaLink: postRow.cta_link,
          likerUsername,
          likerBio,
          likerFollowerCount: likerFollowers,
          channel
        })
      })

      if (!genRes.ok) {
        console.error(`Failed to generate message for channel ${channel}:`, await genRes.text())
        continue
      }

      const { message_text, version_id } = await genRes.json()

      // 2. Add lead tracking code to the CTA link if available
      // The CTA links will point to the capture page: /capture?ref={liker_id}&post={post_id}
      // This allows us to attribute conversions to the exact liker/version!
      const trackingCta = `${appUrl}/capture?ref=${likerRow.id}&post=${postId}`
      const finalMessageText = message_text.replace(postRow.cta_link, trackingCta)

      let sendSuccess = false

      if (channel === 'threads_comment') {
        const commentRes = await fetch(`${appUrl}/api/internal/send-threads-comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-secret': internalSecret,
          },
          body: JSON.stringify({
            threads_user_id: profile.threads_user_id || profile.id, // Fallback
            threads_post_id: threadsPostId,
            messageText: finalMessageText,
            meta_access_token: profile.meta_access_token
          })
        })
        if (commentRes.ok) {
          sendSuccess = true
        } else {
          console.error('Failed to publish Threads comment:', await commentRes.text())
        }
      } else if (channel === 'instagram_dm') {
        const dmRes = await fetch(`${appUrl}/api/internal/send-instagram-dm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-secret': internalSecret,
          },
          body: JSON.stringify({
            liker_instagram_id: likerInstagramId || likerThreadsId, // Fallback
            messageText: finalMessageText,
            meta_access_token: profile.meta_access_token
          })
        })
        if (dmRes.ok) {
          sendSuccess = true
        } else {
          console.error('Failed to send Instagram DM:', await dmRes.text())
        }
      }

      if (sendSuccess) {
        // Save to messages_sent table
        await supabaseAdmin
          .from('messages_sent')
          .insert({
            liker_id: likerRow.id,
            post_id: postId,
            user_id: userId,
            channel,
            message_text: finalMessageText,
            message_version_id: version_id,
            was_clicked: false,
            was_converted: false
          })

        // Increment message_version.times_sent
        const { data: vObj } = await supabaseAdmin
          .from('message_versions')
          .select('times_sent')
          .eq('id', version_id)
          .single()
        
        await supabaseAdmin
          .from('message_versions')
          .update({ times_sent: (vObj?.times_sent || 0) + 1 })
          .eq('id', version_id)

        messagesSentCount++
      }
    }

    if (messagesSentCount > 0) {
      // Mark liker as message sent
      await supabaseAdmin
        .from('likers')
        .update({
          message_sent: true,
          message_sent_at: new Date().toISOString()
        })
        .eq('id', likerRow.id)

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
    console.error('Process like failed:', err)
    
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
