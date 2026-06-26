import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic, ANTHROPIC_MODEL } from '@/lib/anthropic'

const SYSTEM_PROMPT = `You are an expert conversion copywriter. Someone just commented on a Threads post and you need to write TWO messages:

1. PUBLIC REPLY — posted publicly on Threads under their comment (everyone can see this)
2. PRIVATE DM — sent privately to their Instagram inbox (only they see this)

You will receive a JSON object with:
- post_content: the Threads post they commented on
- comment_text: exactly what they typed
- post_goal: freebie / subscribe / book_call / custom
- custom_goal_text: only if goal is custom
- cta_link: the link to include in the DM
- commenter_username: their Threads username
- commenter_bio: their profile bio
- best_performing_version: current best DM template with click_rate (if any)

RULES FOR PUBLIC REPLY (punch 1 - updated):
- Max 200 characters
- Must start with @{commenter_username}
- Include the capture page link exactly: {CAPTURE_URL}
- Keep it short and exciting
- Vary the wording — never send the exact same reply twice
- Examples of good public replies:
  "@username here's your free guide 🎁 → {CAPTURE_URL}"
  "@username sent! Grab it here → {CAPTURE_URL}"

RULES FOR PRIVATE DM (punch 2):
- Max 500 characters
- Start with "Hey {first name from username}!"
- Reference their EXACT comment text naturally in first sentence
- If their bio reveals something about them, use it to personalize
- Deliver the actual value: the link, the freebie, the offer
- One clear CTA with the cta_link on its own line
- Sound like the post owner personally responding, not a bot
- Never use hashtags
- Only use emojis if their bio contains emojis

GOAL INSTRUCTIONS FOR DM:
- freebie: Deliver the resource and make it feel personally chosen for them
- subscribe: Make the community feel exclusive and relevant to their specific interests
- book_call: Frame it as a helpful conversation not a sales call, keep it low pressure
- custom: Follow custom_goal_text exactly but personalize the delivery

LEARNING RULE:
If best_performing_version exists with click_rate above 20%, model the DM structure and tone after it but personalize for this specific person.
If click_rate is below 15%, try a completely different opening and CTA approach.

OUTPUT FORMAT — respond with valid JSON only, no markdown, no explanation:
{
  "public_reply": "the public Threads reply text here",
  "private_dm": "the private Instagram DM text here"
}`

interface GenerateEmailParams {
  liker_username: string
  liker_bio: string
  comment_text: string
  post_goal: string
  custom_goal_text: string
  cta_link: string
  post_owner_name: string
}

export async function generateEmail({
  liker_username,
  liker_bio,
  comment_text,
  post_goal,
  custom_goal_text,
  cta_link,
  post_owner_name
}: GenerateEmailParams) {
  const emailSystemPrompt = `You are an expert email copywriter. Write a short, warm, personalized email 
to someone who just opted in after commenting on a Threads post.

You will receive:
- liker_username: their Threads username
- liker_bio: their profile bio
- comment_text: exactly what they commented
- post_goal: freebie / subscribe / book_call / custom
- custom_goal_text: only if goal is custom
- cta_link: the main link or resource to deliver
- post_owner_name: name of the person sending the email

RULES:
- Subject line: max 50 characters, curiosity-driven, no clickbait
- Email body: max 150 words — short emails get read, long ones don't
- First line must reference what they commented and feel personal
- If their bio reveals something about them, use it in one sentence
- Deliver the actual value immediately — link on its own line
- Warm, human tone — like a message from a real person not a company
- No formal greetings like "Dear" or "Hello"
- Start with their first name only: "Hey {first name},"
- End with post_owner_name signature
- No unsubscribe link needed (Resend handles compliance)
- No HTML formatting in the body text — plain text feel only

OUTPUT: Valid JSON only, no markdown:
{
  "subject": "email subject line here",
  "html": "full email body as plain text with line breaks as \\n"
}`

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1000,
    system: emailSystemPrompt,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          liker_username,
          liker_bio,
          comment_text,
          post_goal,
          custom_goal_text,
          cta_link,
          post_owner_name
        })
      }
    ]
  })

  let messageText = ''
  if (response.content[0].type === 'text') {
    messageText = response.content[0].text.trim()
  } else {
    throw new Error('Claude response content type was not text')
  }

  let jsonOutput: { subject: string; html: string } = { subject: '', html: '' }
  try {
    jsonOutput = JSON.parse(messageText)
  } catch (e) {
    const match = messageText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        jsonOutput = JSON.parse(match[0])
      } catch (inner) {
        console.error('Failed to parse inner JSON from Claude:', inner)
      }
    }
  }

  if (!jsonOutput.subject || !jsonOutput.html) {
    // Generate fallback email
    const subject = `Your requested resource is ready!`
    const body = `Hey,\n\nThanks for reaching out on Threads! Here is your link:\n\n${cta_link}\n\nBest,\n${post_owner_name}`
    return { subject, html: body }
  }

  return jsonOutput
}

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
    likerId,
    appUrl,
    postContent,
    commentText,
    postGoal,
    customGoalText,
    ctaLink,
    likerUsername,
    likerBio,
    likerFollowerCount
  } = body

  if (!postId || !userId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // 1. Pull active message_versions for this post (instagram_dm only for click rate learning)
    const { data: versions, error: vError } = await supabaseAdmin
      .from('message_versions')
      .select('*')
      .eq('post_id', postId)
      .eq('channel', 'instagram_dm')
      .eq('is_active', true)

    if (vError) {
      console.error('Error fetching message versions:', vError)
    }

    // 2. Find the best performing one
    let best_performing_version: any = null
    if (versions && versions.length > 0) {
      const eligible = versions.filter((v: any) => v.times_sent >= 5)
      if (eligible.length > 0) {
        eligible.sort((a: any, b: any) => Number(b.click_rate) - Number(a.click_rate))
        best_performing_version = {
          text: eligible[0].message_template,
          click_rate: eligible[0].click_rate
        }
      }
    }

    // 3. Include input in the Claude prompt as context
    const promptInput = {
      post_content: postContent || '',
      comment_text: commentText || 'FREE',
      post_goal: postGoal || 'custom',
      custom_goal_text: customGoalText || '',
      cta_link: ctaLink || '',
      commenter_username: likerUsername || '',
      commenter_bio: likerBio || '',
      best_performing_version
    }

    // Replace the {CAPTURE_URL} placeholder inside the system prompt before sending to Claude
    const computedAppUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const captureUrl = `${computedAppUrl}/capture?ref=${likerId || 'placeholder_ref'}&post=${postId}`
    const dynamicSystemPrompt = SYSTEM_PROMPT.replace(/\{CAPTURE_URL\}/g, captureUrl)

    // 4. Call Claude API
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system: dynamicSystemPrompt,
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

    // Parse JSON outputs
    let jsonOutput: any = {}
    try {
      jsonOutput = JSON.parse(messageText)
    } catch (e) {
      const match = messageText.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          jsonOutput = JSON.parse(match[0])
        } catch (inner) {
          console.error('Failed to parse inner JSON from Claude:', inner)
        }
      }
    }

    const publicReplyText = jsonOutput.public_reply || `@${likerUsername} done! Check your Instagram DMs! 👀`
    const privateDmText = jsonOutput.private_dm || `Hey ${likerUsername}! Here is your link: ${ctaLink}`

    // 5. Save/Retrieve threads_reply version
    const { data: replyVersions } = await supabaseAdmin
      .from('message_versions')
      .select('*')
      .eq('post_id', postId)
      .eq('channel', 'threads_reply')
      .eq('is_active', true)

    let replyVersionId = ''
    if (!replyVersions || replyVersions.length === 0) {
      const { data: newVersion, error: insertError } = await supabaseAdmin
        .from('message_versions')
        .insert({
          post_id: postId,
          user_id: userId,
          channel: 'threads_reply',
          message_template: publicReplyText,
          version_number: 1,
          is_active: true,
          times_sent: 0,
          times_clicked: 0,
          times_converted: 0
        })
        .select()
        .single()

      if (!insertError && newVersion) {
        replyVersionId = newVersion.id
      } else {
        replyVersionId = crypto.randomUUID()
      }
    } else {
      replyVersionId = replyVersions[0].id
    }

    // 6. Save/Retrieve instagram_dm version
    const { data: dmVersions } = await supabaseAdmin
      .from('message_versions')
      .select('*')
      .eq('post_id', postId)
      .eq('channel', 'instagram_dm')
      .eq('is_active', true)

    let dmVersionId = ''
    if (!dmVersions || dmVersions.length === 0) {
      const { data: newVersion, error: insertError } = await supabaseAdmin
        .from('message_versions')
        .insert({
          post_id: postId,
          user_id: userId,
          channel: 'instagram_dm',
          message_template: privateDmText,
          version_number: 1,
          is_active: true,
          times_sent: 0,
          times_clicked: 0,
          times_converted: 0
        })
        .select()
        .single()

      if (!insertError && newVersion) {
        dmVersionId = newVersion.id
      } else {
        dmVersionId = crypto.randomUUID()
      }
    } else {
      dmVersionId = dmVersions[0].id
    }

    // 7. Return both messages and version IDs
    return NextResponse.json({
      public_reply: {
        text: publicReplyText,
        version_id: replyVersionId
      },
      private_dm: {
        text: privateDmText,
        version_id: dmVersionId
      }
    })
  } catch (err: any) {
    console.error('Generate message failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

