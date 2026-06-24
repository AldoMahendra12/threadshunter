import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { paddle } from '@/lib/paddle'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const customerId = profile?.stripe_customer_id

  if (!customerId || customerId.startsWith('your-') || customerId.startsWith('stripe_')) {
    // If no real customer ID exists, redirect back to settings
    return NextResponse.redirect(new URL('/dashboard/settings?portal=error_no_customer', req.url))
  }

  try {
    // Create customer portal session using Paddle SDK
    const session = await paddle.customerPortalSessions.create({
      customerId: customerId,
    })

    const portalUrl = session.urls?.general?.overview

    if (!portalUrl) {
      throw new Error('No portal URL returned from Paddle API')
    }

    return NextResponse.redirect(portalUrl)
  } catch (err: any) {
    console.error('Paddle Portal session creation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create Paddle portal session' }, { status: 500 })
  }
}
