import { NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Threads may append #_=_ to the URL, but Next.js searchParams handles the clean URL mostly
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code from Threads' }, { status: 400 })
  }

  const threadsAppId = process.env.THREADS_APP_ID
  const threadsAppSecret = process.env.THREADS_APP_SECRET

  if (!threadsAppId || !threadsAppSecret) {
    return NextResponse.json({ error: 'Threads App credentials are not configured' }, { status: 500 })
  }

  const redirectUri = `${origin}/api/auth/threads/callback`

  try {
    // 1. Exchange Code for Access Token
    const form = new URLSearchParams()
    form.append('client_id', threadsAppId)
    form.append('client_secret', threadsAppSecret)
    form.append('grant_type', 'authorization_code')
    form.append('redirect_uri', redirectUri)
    form.append('code', code)

    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      body: form,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('Threads Token Exchange Failed:', errText)
      return NextResponse.redirect(`${origin}/dashboard/settings?error=threads_oauth_failed`)
    }

    const tokenData = await tokenRes.json()
    const { access_token, user_id } = tokenData

    if (!access_token || !user_id) {
      throw new Error('Invalid token response from Threads API')
    }

    // 2. Identify the currently logged in Supabase user
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      // User is not logged in to our app. Redirect them to login first.
      return NextResponse.redirect(`${origin}/?error=login_required_for_threads`)
    }

    // 3. Save the token and threads user ID to their profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        meta_access_token: access_token, // Store the short-lived Threads token (we should refresh this later)
        threads_user_id: user_id.toString(),
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Failed to save Threads token to profile:', updateError)
      return NextResponse.redirect(`${origin}/dashboard/settings?error=profile_update_failed`)
    }

    // Redirect back to dashboard on success
    return NextResponse.redirect(`${origin}/dashboard/settings?success=threads_connected`)
  } catch (err: any) {
    console.error('Threads Callback Error:', err)
    return NextResponse.redirect(`${origin}/dashboard/settings?error=unknown_error`)
  }
}
