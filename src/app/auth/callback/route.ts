import { NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      const user = data.session.user
      const providerToken = data.session.provider_token

      // Save the Meta token and fetch user details if available
      if (providerToken) {
        let threadsUserId = ''
        let instagramUserId = ''

        try {
          // Fetch Threads profile ID
          const tRes = await fetch(`https://graph.threads.net/v1.0/me?fields=id&access_token=${providerToken}`)
          if (tRes.ok) {
            const tData = await tRes.json()
            threadsUserId = tData.id
          }
        } catch (err) {
          console.error('Failed to resolve Threads profile ID on login:', err)
        }

        try {
          // Fetch Instagram profile ID
          const igRes = await fetch(`https://graph.instagram.com/v21.0/me?fields=id&access_token=${providerToken}`)
          if (igRes.ok) {
            const igData = await igRes.json()
            instagramUserId = igData.id
          }
        } catch (err) {
          console.error('Failed to resolve Instagram profile ID on login:', err)
        }

        // Update profile in database
        await supabaseAdmin
          .from('profiles')
          .update({
            meta_access_token: providerToken,
            threads_user_id: threadsUserId || user.id,
            instagram_user_id: instagramUserId || null,
            meta_token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
          })
          .eq('id', user.id)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
