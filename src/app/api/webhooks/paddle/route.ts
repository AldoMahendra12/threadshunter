import { NextRequest, NextResponse } from 'next/server'
import { paddle, getPaddlePlanByPriceId } from '@/lib/paddle'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body = ''
  try {
    body = await req.text()
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read raw body' }, { status: 400 })
  }

  const signature = req.headers.get('paddle-signature') || ''
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || ''

  let event: any
  try {
    // If webhook secret is configured, verify signature
    if (webhookSecret && webhookSecret !== 'your-paddle-webhook-secret-key') {
      event = paddle.webhooks.unmarshal(body, webhookSecret, signature)
    } else {
      // For local testing/dev when secret is not configured
      event = JSON.parse(body)
    }
  } catch (err: any) {
    console.error('Paddle webhook verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Verification Error: ${err.message}` }, { status: 400 })
  }

  try {
    const eventType = event.eventType || event.event_type
    const data = event.data

    if (!data) {
      return NextResponse.json({ error: 'No data object in payload' }, { status: 400 })
    }

    const subscriptionId = data.id
    const customerId = data.customerId || data.customer_id
    const status = data.status // active, trialing, past_due, paused, canceled
    const userId = data.customData?.userId || data.custom_data?.userId
    
    // Get the price ID from the first item
    const priceId = data.items?.[0]?.price?.id

    console.log(`Processing Paddle Webhook: ${eventType} | User: ${userId} | Sub: ${subscriptionId} | Status: ${status}`)

    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated': {
        let planId = 'free'
        if (status === 'active' || status === 'trialing') {
          if (priceId) {
            const matchedPlan = getPaddlePlanByPriceId(priceId)
            if (matchedPlan) {
              planId = matchedPlan.id
            }
          }
        }

        // We update using userId if available, otherwise fallback to customerId matching
        const query = userId 
          ? supabaseAdmin.from('profiles').update({
              plan: planId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: status
            }).eq('id', userId)
          : supabaseAdmin.from('profiles').update({
              plan: planId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: status
            }).eq('stripe_customer_id', customerId)

        const { error } = await query

        if (error) {
          console.error('Failed to update profile after Paddle event:', error)
          throw error
        }
        break
      }

      case 'subscription.canceled': {
        const query = userId
          ? supabaseAdmin.from('profiles').update({
              plan: 'free',
              stripe_subscription_id: null,
              stripe_subscription_status: 'canceled'
            }).eq('id', userId)
          : supabaseAdmin.from('profiles').update({
              plan: 'free',
              stripe_subscription_id: null,
              stripe_subscription_status: 'canceled'
            }).eq('stripe_customer_id', customerId)

        const { error } = await query

        if (error) {
          console.error('Failed to cancel subscription after Paddle event:', error)
          throw error
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Paddle webhook processing error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
