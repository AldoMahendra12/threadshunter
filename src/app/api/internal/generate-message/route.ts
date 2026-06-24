import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic, ANTHROPIC_MODEL } from '@/lib/anthropic'

const SYSTEM_PROMPT = `You are an expert conversion copywriter specializing in social media outreach. Your job is to write a short, highly personalized message to someone who just liked a social media post.

You will receive a JSON object with:
- post_content: the post they liked
- post_goal: freebie / subscribe / book_call / custom
- custom_goal_text: only if goal is custom
- cta_link: the link to include
- liker_username: their username
- liker_bio: their profile bio
- liker_follower_count: number of followers they have
- channel: threads_comment or instagram_dm
- best_performing_version: the current best message (if any) with its click_rate
- previous_versions: array of past messages and their click rates

RULES:
1. Feel 100% human — never sound like a bot or marketer
2. Reference something SPECIFIC from their bio or the post content
3. If liker_bio is empty, reference only the post content
4. Character limits: threads_comment = max 280 chars, instagram_dm = max 500 chars
5. End with the CTA link on its own line
6. Never use hashtags
7. Never use emojis unless their bio contains emojis
8. For threads_comment: start with @{liker_username}
9. For instagram_dm: start with "Hey {first word of username}!"
10. If best_performing_version exists with click_rate > 20%, model the tone and structure after it but personalize for this specific person
11. If best_performing_version has click_rate < 15%, try a completely different approach
12. Match the tone of the post_content (professional / casual / funny)

GOAL INSTRUCTIONS:
- freebie: Make the free resource feel like it was made specifically for someone like them
- subscribe: Make the newsletter/community feel exclusive and relevant to their interests
- book_call: Frame it as a helpful conversation, never a sales pitch
- custom: Follow custom_goal_text exactly but personalize the delivery

OUTPUT: Return ONLY the message text. No quotes, no explanation, no alternatives.`

export async function POST(req: NextRequest) {
  // Verify INTERNAL_API_SECRET header
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

  const {
    postId,
    userId,
    postContent,
    postGoal,
    customGoalText,
    ctaLink,
    likerUsername,
    likerBio,
    likerFollowerCount,
    channel
  } = body

  if (!postId || !userId || !channel) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // 1. Pull active message_versions for this post+channel from database
    const { data: versions, error: vError } = await supabaseAdmin
      .from('message_versions')
      .select('*')
      .eq('post_id', postId)
      .eq('channel', channel)
      .eq('is_active', true)

    if (vError) {
      console.error('Error fetching message versions:', vError)
    }

    // 2. Find the best performing one (highest click_rate with times_sent >= 5)
    let best_performing_version: any = null
    const previous_versions: any[] = []

    if (versions && versions.length > 0) {
      versions.forEach((v: any) => {
        previous_versions.push({
          message_text: v.message_template,
          click_rate: v.click_rate,
          times_sent: v.times_sent
        })
      })

      const eligible = versions.filter((v: any) => v.times_sent >= 5)
      if (eligible.length > 0) {
        eligible.sort((a: any, b: any) => Number(b.click_rate) - Number(a.click_rate))
        best_performing_version = {
          text: eligible[0].message_template,
          click_rate: eligible[0].click_rate
        }
      }
    }

    // 3. Include all versions in the Claude prompt as context
    const promptInput = {
      post_content: postContent || '',
      post_goal: postGoal || 'custom',
      custom_goal_text: customGoalText || '',
      cta_link: ctaLink || '',
      liker_username: likerUsername || '',
      liker_bio: likerBio || '',
      liker_follower_count: likerFollowerCount || 0,
      channel,
      best_performing_version,
      previous_versions
    }

    // 4. Call Claude API
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(promptInput)
        }
      ]
    })

    let messageText = ''
    if (response.content[0].type === 'text') {
      messageText = response.content[0].text.trim()
    } else {
      throw new Error('Claude response content type was not text')
    }

    // 5. Save the new message as a message_versions entry if no active version exists
    let versionId = ''
    if (!versions || versions.length === 0) {
      const { data: newVersion, error: insertError } = await supabaseAdmin
        .from('message_versions')
        .insert({
          post_id: postId,
          user_id: userId,
          channel,
          message_template: messageText,
          version_number: 1,
          is_active: true,
          times_sent: 0,
          times_clicked: 0,
          times_converted: 0
        })
        .select()
        .single()

      if (insertError || !newVersion) {
        console.error('Error inserting new message version:', insertError)
        // Fallback to generating a dummy uuid so execution doesn't block
        versionId = crypto.randomUUID()
      } else {
        versionId = newVersion.id
      }
    } else {
      // Use the active version
      versionId = versions[0].id
    }

    // 6. Return { message_text, version_id }
    return NextResponse.json({ message_text: messageText, version_id: versionId })
  } catch (err: any) {
    console.error('Generate message failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
