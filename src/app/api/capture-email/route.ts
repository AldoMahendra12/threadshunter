import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { generateEmail } from '@/app/api/internal/generate-message/route'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { refId, postId, email, whatsapp } = body

  if (!refId || !postId || !email) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // 1. Verify ref (liker_id) and post_id exist in DB
    const { data: post, error: postErr } = await supabaseAdmin
      .from('monitored_posts')
      .select('*, profiles(*)')
      .eq('id', postId)
      .single()

    const { data: liker, error: likerErr } = await supabaseAdmin
      .from('likers')
      .select('*')
      .eq('id', refId)
      .single()

    if (postErr || !post || likerErr || !liker) {
      return NextResponse.json({ error: 'Associated post or commenter record not found' }, { status: 404 })
    }

    // Check if lead already exists to avoid duplicates
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('liker_id', refId)
      .eq('source_post_id', postId)
      .maybeSingle()

    if (existingLead) {
      // Just return success and redirect since they already opted in
      return NextResponse.json({ success: true, redirectUrl: post.cta_link })
    }

    // 2. Save to leads table
    const { error: leadErr } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: post.user_id,
        liker_id: refId,
        source_post_id: postId,
        email: email,
        whatsapp: whatsapp || null,
        captured_at: new Date().toISOString()
      })

    if (leadErr) {
      throw leadErr
    }

    // 3. Mark the liker as converted and email sent
    const { error: likerUpdateErr } = await supabaseAdmin
      .from('likers')
      .update({ 
        was_converted: true, 
        converted_at: new Date().toISOString(),
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', refId)

    if (likerUpdateErr) {
      console.error('Failed to update liker conversion state:', likerUpdateErr)
    }

    // 4. Mark originating messages as converted & retrieve versions
    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('messages_sent')
      .update({ 
        was_converted: true, 
        converted_at: new Date().toISOString() 
      })
      .eq('liker_id', refId)
      .select('message_version_id')

    if (msgErr) {
      console.error('Failed to update messages sent conversion state:', msgErr)
    }

    // 5. Increment message_versions.times_converted
    if (messages) {
      for (const m of messages) {
        if (m.message_version_id) {
          const { data: vObj } = await supabaseAdmin
            .from('message_versions')
            .select('times_converted')
            .eq('id', m.message_version_id)
            .single()
          
          await supabaseAdmin
            .from('message_versions')
            .update({ times_converted: (vObj?.times_converted || 0) + 1 })
            .eq('id', m.message_version_id)
        }
      }
    }

    // Update monitored_posts total_leads
    const { data: postStats } = await supabaseAdmin
      .from('monitored_posts')
      .select('total_leads')
      .eq('id', postId)
      .single()

    await supabaseAdmin
      .from('monitored_posts')
      .update({ total_leads: (postStats?.total_leads || 0) + 1 })
      .eq('id', postId)

    // 6. Generate personalized email content with Claude
    const postOwnerName = post.profiles?.full_name || 'Creator'
    
    const emailContent = await generateEmail({
      liker_username: liker.liker_username || '',
      liker_bio: liker.liker_bio || '',
      comment_text: liker.comment_text || '',
      post_goal: post.goal || 'custom',
      custom_goal_text: post.custom_goal_text || '',
      cta_link: post.cta_link,
      post_owner_name: postOwnerName
    })

    // Split text paragraphs and wrap in required styling
    const htmlBody = emailContent.html
      .split('\n')
      .map(line => line ? `<p style="margin:0 0 12px;font-family:sans-serif;font-size:16px;color:#111;">${line}</p>` : '')
      .join('')

    const wrappedHtml = `
      <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
        ${htmlBody}
      </div>
    `

    // Log the email message in messages_sent
    await supabaseAdmin
      .from('messages_sent')
      .insert({
        liker_id: refId,
        post_id: postId,
        user_id: post.user_id,
        channel: 'email',
        message_text: wrappedHtml,
        was_converted: true,
        converted_at: new Date().toISOString(),
        sent_at: new Date().toISOString()
      })

    // 7. Send email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: emailContent.subject,
      html: wrappedHtml
    })

    // 8. Return success and CTA redirect link
    return NextResponse.json({ success: true, redirectUrl: post.cta_link })
  } catch (err: any) {
    console.error('Capture email failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
