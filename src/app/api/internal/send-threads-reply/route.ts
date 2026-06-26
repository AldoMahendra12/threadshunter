import { NextRequest, NextResponse } from 'next/server'

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

  const { post_owner_threads_id, reply_to_id, reply_text, access_token } = body

  if (!post_owner_threads_id || !reply_to_id || !reply_text || !access_token) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // Step A: Create the reply media container
    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${post_owner_threads_id}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: reply_text,
          reply_to_id: reply_to_id, // reply TO the comment ID
          access_token: access_token
        })
      }
    )

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Failed to create Threads reply container:', errText)
      return NextResponse.json({ error: `Create media container failed: ${errText}` }, { status: createRes.status })
    }

    const { id: creation_id } = await createRes.json()

    if (!creation_id) {
      throw new Error('No creation_id returned from Threads API')
    }

    // Step B: Publish the reply container
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${post_owner_threads_id}/threads_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id,
          access_token: access_token
        })
      }
    )

    if (!publishRes.ok) {
      const errText = await publishRes.text()
      console.error('Failed to publish Threads reply container:', errText)
      return NextResponse.json({ error: `Publish media failed: ${errText}` }, { status: publishRes.status })
    }

    const publishData = await publishRes.json()

    return NextResponse.json({ success: true, published_id: publishData.id })
  } catch (err: any) {
    console.error('Send Threads reply failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
