import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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

  const { threads_user_id, threads_post_id, messageText, meta_access_token } = body

  if (!threads_user_id || !threads_post_id || !messageText || !meta_access_token) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  // Handle Meta API rate limits/errors with exponential backoff and max 3 retries
  let attempt = 0
  const maxRetries = 3
  let delay = 1000 // Start with 1s delay

  while (attempt < maxRetries) {
    try {
      // Step 1: Create the reply
      const createRes = await fetch(`https://graph.threads.net/v1.0/${threads_user_id}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: messageText,
          reply_to_id: threads_post_id,
          access_token: meta_access_token
        })
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        throw new Error(`Failed to create Threads reply: ${errText}`)
      }

      const { id: creation_id } = await createRes.json()

      // Step 2: Publish the reply
      const publishRes = await fetch(`https://graph.threads.net/v1.0/${threads_user_id}/threads_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id, access_token: meta_access_token })
      })

      if (!publishRes.ok) {
        const errText = await publishRes.text()
        throw new Error(`Failed to publish Threads reply: ${errText}`)
      }

      const publishData = await publishRes.json()
      return NextResponse.json({ success: true, data: publishData })
    } catch (err: any) {
      attempt++
      console.warn(`Threads publish attempt ${attempt} failed: ${err.message}`)
      if (attempt >= maxRetries) {
        return NextResponse.json({ error: err.message || 'Failed to send Threads comment' }, { status: 500 })
      }
      // Wait for backoff delay
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }

  return NextResponse.json({ error: 'Maximum retries exceeded' }, { status: 500 })
}
