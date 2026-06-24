import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

// GET handler for Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// Helper to verify X-Hub-Signature-256 header
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  // Meta webhook signature uses the App Secret
  const secret = process.env.META_APP_SECRET || process.env.META_WEBHOOK_VERIFY_TOKEN || ''
  if (!secret) return true // Allow local dev testing bypass if not configured

  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const expectedSignature = `sha256=${hash}`
  return signature === expectedSignature
}

// POST handler for receiving like events
export async function POST(req: NextRequest) {
  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const signatureHeader = req.headers.get('x-hub-signature-256')
  const isSignatureValid = process.env.NODE_ENV === 'development' || verifySignature(rawBody, signatureHeader)
  if (!isSignatureValid) {
    console.error('Meta webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Parse webhook like fields
  let threads_post_id = ''
  let liker_threads_id = ''
  let event_type = 'like'

  // Extract from typical Threads webhook schema
  if (payload.entry && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'likes' || change.field === 'comments') {
            threads_post_id = change.value?.media_id || change.value?.id || ''
            liker_threads_id = change.value?.from?.id || ''
            event_type = change.field
          }
        }
      }
    }
  }

  // Fallback for custom dev testing payload format
  if (!threads_post_id && payload.threads_post_id) {
    threads_post_id = payload.threads_post_id
    liker_threads_id = payload.liker_threads_id || ''
    event_type = payload.event_type || 'like'
  }

  // 3. Log the raw event to webhook_events table immediately
  const { data: eventRow, error: insertError } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      event_type,
      threads_post_id,
      liker_threads_id,
      raw_payload: payload,
      processed: false
    })
    .select()
    .single()

  if (insertError || !eventRow) {
    console.error('Failed to log webhook event:', insertError)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }

  if (!threads_post_id || !liker_threads_id) {
    // Return 200 OK so Meta doesn't retry, but mark as error
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: 'Missing threads_post_id or liker_threads_id in event payload'
      })
      .eq('id', eventRow.id)
    return NextResponse.json({ success: true, message: 'Skipped: missing details' })
  }

  // 4. Find the matching monitored_posts row by threads_post_id
  const { data: postRow, error: postError } = await supabaseAdmin
    .from('monitored_posts')
    .select('*')
    .eq('threads_post_id', threads_post_id)
    .eq('is_active', true)
    .maybeSingle()

  if (postError || !postRow) {
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: postError ? postError.message : 'No active monitored post found'
      })
      .eq('id', eventRow.id)
    return NextResponse.json({ success: true, message: 'Skipped: no active monitored post' })
  }

  // 5. Check likers table for duplicate (same post + liker = skip)
  const { data: existingLiker } = await supabaseAdmin
    .from('likers')
    .select('id')
    .eq('post_id', postRow.id)
    .eq('liker_threads_id', liker_threads_id)
    .maybeSingle()

  if (existingLiker) {
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: 'Duplicate liker for this post'
      })
      .eq('id', eventRow.id)
    return NextResponse.json({ success: true, message: 'Skipped: duplicate like' })
  }

  // 6. Trigger /api/internal/process-like asynchronously
  const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/process-like`
  const internalSecret = process.env.INTERNAL_API_SECRET || ''

  try {
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': internalSecret,
      },
      body: JSON.stringify({
        eventId: eventRow.id,
        postId: postRow.id,
        threadsPostId: threads_post_id,
        likerThreadsId: liker_threads_id,
        userId: postRow.user_id,
      }),
      signal: AbortSignal.timeout(1), // Abort immediately to run asynchronously
    }).catch(() => {
      // Catch aborted request errors silently
    })
  } catch (err) {
    // Catch fetch parse/init errors
  }

  // 7. Return 200 OK within 5 seconds
  return NextResponse.json({ success: true, message: 'Processing started' })
}
