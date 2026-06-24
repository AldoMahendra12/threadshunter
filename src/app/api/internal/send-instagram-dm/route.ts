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

  const { liker_instagram_id, messageText, meta_access_token } = body

  if (!liker_instagram_id || !messageText || !meta_access_token) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  // Handle Meta API rate limits/errors with exponential backoff and max 3 retries
  let attempt = 0
  const maxRetries = 3
  let delay = 1000 // Start with 1s delay

  while (attempt < maxRetries) {
    try {
      const res = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meta_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: liker_instagram_id },
          message: { text: messageText }
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Failed to send Instagram DM: ${errText}`)
      }

      const data = await res.json()
      return NextResponse.json({ success: true, data })
    } catch (err: any) {
      attempt++
      console.warn(`Instagram DM send attempt ${attempt} failed: ${err.message}`)
      if (attempt >= maxRetries) {
        return NextResponse.json({ error: err.message || 'Failed to send Instagram DM' }, { status: 500 })
      }
      // Wait for backoff delay
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }

  return NextResponse.json({ error: 'Maximum retries exceeded' }, { status: 500 })
}
