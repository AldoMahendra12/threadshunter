import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const threadsAppId = process.env.THREADS_APP_ID
  
  if (!threadsAppId) {
    return NextResponse.json({ error: 'THREADS_APP_ID is not configured' }, { status: 500 })
  }

  // Construct the redirect URI for the callback
  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/auth/threads/callback`

  // Threads API requires comma-separated scopes
  const scopes = 'threads_basic,threads_content_publish,threads_manage_replies'

  // Construct the Threads Authorization URL
  const authUrl = new URL('https://threads.net/oauth/authorize')
  authUrl.searchParams.set('client_id', threadsAppId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('response_type', 'code')

  // Redirect the user to Threads to approve permissions
  return NextResponse.redirect(authUrl.toString())
}
