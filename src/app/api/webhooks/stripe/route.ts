import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanByPriceId } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read raw body' }, { status: 400 })
  }

  const sig = req.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    // For local development, allow webhook parsing without verification if secret is not set
    if (!webhookSecret) {
      try {
        event = JSON.parse(body)
      } catch (jsonErr) {
        return NextResponse.json({ error: `JSON Parse error: ${err.message}` }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }
  }

  try {
    const eventType = event.type || event.event_type // Fallback for local JSON mock
    const dataObject = event.data?.object || event.data // Fallback for local JSON mock

    switch (eventType) {
      case 'checkout.session.completed': {
        const session = dataObject
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (userId && planId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: planId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: 'active'
            })
            .eq('id', userId)

          if (error) {
            console.error('Failed to update profile after Stripe checkout:', error)
            throw error
          }
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = dataObject
        const customerId = subscription.customer
        const status = subscription.status // active, past_due, trialing, canceled
        const priceId = subscription.items?.data?.[0]?.price?.id

        if (customerId) {
          // Determine the plan based on Stripe price ID
          let planId = 'free'
          if (priceId) {
            const matchedPlan = getPlanByPriceId(priceId)
            if (matchedPlan) {
              planId = matchedPlan.id
            }
          }

          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: planId,
              stripe_subscription_status: status
            })
            .eq('stripe_customer_id', customerId)

          if (error) {
            console.error('Failed to update profile on subscription update:', error)
            throw error
          }
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = dataObject
        const customerId = subscription.customer

        if (customerId) {
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              stripe_subscription_status: 'canceled'
            })
            .eq('stripe_customer_id', customerId)

          if (error) {
            console.error('Failed to downgrade profile on subscription delete:', error)
            throw error
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
