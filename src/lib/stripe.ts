import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not defined in environment variables.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
})

export interface PlanConfig {
  id: 'free' | 'starter' | 'pro' | 'scale'
  name: string
  priceId: string | null
  postsLimit: number
  messagesLimit: number
  channels: ('threads_comment' | 'instagram_dm' | 'both')[]
  features: string[]
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceId: null,
    postsLimit: 1,
    messagesLimit: 50,
    channels: ['threads_comment'],
    features: [
      '1 monitored post',
      '50 messages/month',
      'Threads comment only',
      'No AI learning'
    ]
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || null,
    postsLimit: 5,
    messagesLimit: 500,
    channels: ['threads_comment', 'instagram_dm', 'both'],
    features: [
      '5 monitored posts',
      '500 messages/month',
      'Threads comment + Instagram DM',
      'AI learning loop'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    postsLimit: 20,
    messagesLimit: 2000,
    channels: ['threads_comment', 'instagram_dm', 'both'],
    features: [
      '20 monitored posts',
      '2000 messages/month',
      'All channels',
      'AI learning + A/B testing',
      'CSV export'
    ]
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    priceId: process.env.STRIPE_SCALE_PRICE_ID || null,
    postsLimit: Infinity,
    messagesLimit: Infinity,
    channels: ['threads_comment', 'instagram_dm', 'both'],
    features: [
      'Unlimited posts',
      'Unlimited messages',
      'All channels',
      'White label lead capture',
      '3 team seats'
    ]
  }
}

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find(p => p.priceId === priceId)
}
