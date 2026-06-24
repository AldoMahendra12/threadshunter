import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { stripe, PLANS } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('plan')

  if (!planId || !PLANS[planId]) {
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // If not logged in, redirect to auth screen (we can point to dashboard which handles auth redirect)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Get user profile to check customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    try {
      // Create Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email || 'Threads Hunter User',
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id
      
      // Save customer ID in profiles
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    } catch (err: any) {
      console.error('Stripe customer creation error:', err)
      return NextResponse.json({ error: 'Failed to register checkout customer profile' }, { status: 500 })
    }
  }

  if (planId === 'free') {
    // Free plan just redirects back to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const planConfig = PLANS[planId]
  if (!planConfig.priceId) {
    return NextResponse.json({ error: 'Price ID not configured for this plan' }, { status: 500 })
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: user.id,
        planId: planId
      }
    })

    return NextResponse.redirect(session.url!)
  } catch (err: any) {
    console.error('Stripe session creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
