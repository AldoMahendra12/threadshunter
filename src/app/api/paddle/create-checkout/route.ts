import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { paddle, PADDLE_PLANS } from '@/lib/paddle'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('plan')

  if (!planId || !PADDLE_PLANS[planId]) {
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (planId === 'free') {
    // Free plan just redirects back to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const planConfig = PADDLE_PLANS[planId]
  if (!planConfig.priceId || planConfig.priceId === 'pri_starter_id' || planConfig.priceId === 'pri_pro_id' || planConfig.priceId === 'pri_scale_id') {
    return NextResponse.json({ error: 'Paddle Price ID not configured yet. Please configure PADDLE_STARTER_PRICE_ID, PADDLE_PRO_PRICE_ID, and PADDLE_SCALE_PRICE_ID in your environment.' }, { status: 500 })
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create transaction using Paddle Node SDK
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: planConfig.priceId,
          quantity: 1,
        },
      ],
      customData: {
        userId: user.id,
        planId: planId,
      },
      // You can also pass customer email if we want to prefill
      customer: {
        email: user.email || '',
      },
      // Optional: paddle billing requires returnUrl for checkout URL generation
      returnUrl: `${appUrl}/dashboard?checkout=success`,
    })

    const checkoutUrl = transaction.checkout?.url

    if (!checkoutUrl) {
      throw new Error('No checkout URL returned from Paddle API. Ensure default payment link/approved domain is configured in Paddle Dashboard.')
    }

    return NextResponse.redirect(checkoutUrl)
  } catch (err: any) {
    console.error('Paddle transaction creation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create Paddle checkout session' }, { status: 500 })
  }
}
