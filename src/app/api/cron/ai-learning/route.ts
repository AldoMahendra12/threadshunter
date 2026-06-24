import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic, ANTHROPIC_MODEL } from '@/lib/anthropic'

const SYSTEM_PROMPT_REWRITE = `You are a conversion rate optimization expert for social media outreach messages.

A message is underperforming and needs to be rewritten.

You will receive:
- original_message: the message that was sent
- click_rate: what percentage of people clicked the link (this is LOW — that's why we're rewriting)
- times_sent: how many times this message was sent
- post_content: the original post people liked
- post_goal: the goal of the message
- cta_link: the call to action link
- channel: threads_comment or instagram_dm
- other_versions: all other message versions for this post with their click rates

WHAT TO CHANGE:
- If click_rate < 5%: The opening hook is wrong. Try a completely different first line.
- If click_rate 5-10%: The CTA is weak. Try a more specific, lower-commitment ask.
- If click_rate 10-15%: The personalization is off. Be more specific and relevant.
- Always study other_versions — if one has higher click_rate, understand WHY and do more of that.
- Try shorter if original is long. Try longer if original is very short.
- Try question-based opening if original was statement-based, or vice versa.

RULES:
- Keep the same cta_link
- Keep the same channel character limits (threads_comment = 280 chars, instagram_dm = 500 chars)
- For threads_comment keep the @username format at start
- For instagram_dm keep the Hey {name}! format at start
- Output ONLY the new message text. Nothing else.`

export async function GET(req: NextRequest) {
  // Protect cron route
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Find all active message_versions where times_sent >= 10 and click_rate < 15
    const { data: lowVersions, error: vError } = await supabaseAdmin
      .from('message_versions')
      .select('*')
      .eq('is_active', true)
      .gte('times_sent', 10)
      .lt('click_rate', 15)

    if (vError) {
      throw vError
    }

    if (!lowVersions || lowVersions.length === 0) {
      return NextResponse.json({ success: true, message: 'No underperforming message versions found.' })
    }

    const rewrittenVersionsCount = 0
    const logs: string[] = []

    for (const version of lowVersions) {
      // Fetch post content
      const { data: post, error: postErr } = await supabaseAdmin
        .from('monitored_posts')
        .select('*')
        .eq('id', version.post_id)
        .single()

      if (postErr || !post) {
        logs.push(`Skipped version ${version.id}: post not found or error.`)
        continue
      }

      // Fetch other versions for comparison
      const { data: otherVersions } = await supabaseAdmin
        .from('message_versions')
        .select('*')
        .eq('post_id', version.post_id)
        .eq('channel', version.channel)
        .neq('id', version.id)

      const otherVersionsMapped = otherVersions?.map((ov: any) => ({
        message_text: ov.message_template,
        click_rate: ov.click_rate,
        times_sent: ov.times_sent
      })) || []

      const promptInput = {
        original_message: version.message_template,
        click_rate: version.click_rate,
        times_sent: version.times_sent,
        post_content: post.post_content || '',
        post_goal: post.goal || 'custom',
        cta_link: post.cta_link || '',
        channel: version.channel,
        other_versions: otherVersionsMapped
      }

      // Call Claude API to rewrite
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT_REWRITE,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(promptInput)
          }
        ]
      })

      let newText = ''
      if (response.content[0].type === 'text') {
        newText = response.content[0].text.trim()
      } else {
        logs.push(`Skipped version ${version.id}: Claude did not return text.`)
        continue
      }

      // Save new version, deactivate old version
      const { error: insertErr } = await supabaseAdmin
        .from('message_versions')
        .insert({
          post_id: version.post_id,
          user_id: version.user_id,
          channel: version.channel,
          message_template: newText,
          version_number: (version.version_number || 1) + 1,
          rewrite_reason: 'auto_ai_rewrite_low_ctr',
          is_active: true,
          times_sent: 0,
          times_clicked: 0,
          times_converted: 0
        })

      if (insertErr) {
        logs.push(`Skipped version ${version.id}: Failed to save new version.`)
        continue
      }

      // Deactivate old version
      await supabaseAdmin
        .from('message_versions')
        .update({ is_active: false })
        .eq('id', version.id)

      logs.push(`Successfully rewrote version ${version.id} to new templates.`)
    }

    return NextResponse.json({ success: true, processed: logs.length, logs })
  } catch (err: any) {
    console.error('AI Learning cron error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
