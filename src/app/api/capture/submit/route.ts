import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
    // 1. Fetch monitored post details
    const { data: post, error: postErr } = await supabaseAdmin
      .from('monitored_posts')
      .select('user_id, cta_link')
      .eq('id', postId)
      .single()

    if (postErr || !post) {
      throw new Error('Associated monitored post not found')
    }

    // 2. Save lead to leads table
    const { error: leadErr } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: post.user_id,
        liker_id: refId,
        source_post_id: postId,
        email,
        whatsapp: whatsapp || null
      })

    if (leadErr) {
      throw leadErr
    }

    // 3. Mark originating message as was_converted = true
    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('messages_sent')
      .update({
        was_converted: true,
        converted_at: new Date().toISOString()
      })
      .eq('liker_id', refId)
      .eq('post_id', postId)
      .select('message_version_id')
      .maybeSingle()

    if (msgErr) {
      console.error('Failed to update message conversion state:', msgErr)
    }

    // 4. Increment message_versions.times_converted
    if (msg && msg.message_version_id) {
      const { data: vObj } = await supabaseAdmin
        .from('message_versions')
        .select('times_converted')
        .eq('id', msg.message_version_id)
        .single()
      
      await supabaseAdmin
        .from('message_versions')
        .update({ times_converted: (vObj?.times_converted || 0) + 1 })
        .eq('id', msg.message_version_id)
    }

    // 5. Update monitored_posts total_leads
    const { data: postStats } = await supabaseAdmin
      .from('monitored_posts')
      .select('total_leads')
      .eq('id', postId)
      .single()

    await supabaseAdmin
      .from('monitored_posts')
      .update({ total_leads: (postStats?.total_leads || 0) + 1 })
      .eq('id', postId)

    // Return CTA redirection link
    return NextResponse.json({ success: true, redirectUrl: post.cta_link })
  } catch (err: any) {
    console.error('Lead submit failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
