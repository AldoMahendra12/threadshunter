import { Paddle, Environment } from '@paddle/paddle-node-sdk'

if (!process.env.PADDLE_API_KEY) {
  console.warn('Warning: PADDLE_API_KEY is not defined in environment variables.')
}

const isProduction = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' || 
                     (process.env.PADDLE_API_KEY && process.env.PADDLE_API_KEY.startsWith('pdl_live'))

export const paddle = new Paddle(process.env.PADDLE_API_KEY || 'pdl_sandbox_placeholder', {
  environment: isProduction ? Environment.production : Environment.sandbox,
})

export interface PaddlePlanConfig {
  id: 'free' | 'starter' | 'pro' | 'scale'
  name: string
  priceId: string | null
  postsLimit: number
  messagesLimit: number
  channels: ('threads_reply' | 'instagram_dm' | 'both')[]
  features: string[]
}

export const PADDLE_PLANS: Record<string, PaddlePlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceId: null,
    postsLimit: 1,
    messagesLimit: 50,
    channels: ['threads_reply'],
    features: [
      '1 monitored post',
      '50 messages/month',
      'Threads reply only',
      'No AI learning'
    ]
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceId: process.env.PADDLE_STARTER_PRICE_ID || null,
    postsLimit: 5,
    messagesLimit: 500,
    channels: ['threads_reply', 'instagram_dm', 'both'],
    features: [
      '5 monitored posts',
      '500 messages/month',
      'Threads reply + Instagram DM',
      'AI learning loop'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.PADDLE_PRO_PRICE_ID || null,
    postsLimit: 20,
    messagesLimit: 2000,
    channels: ['threads_reply', 'instagram_dm', 'both'],
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
    priceId: process.env.PADDLE_SCALE_PRICE_ID || null,
    postsLimit: Infinity,
    messagesLimit: Infinity,
    channels: ['threads_reply', 'instagram_dm', 'both'],
    features: [
      'Unlimited posts',
      'Unlimited messages',
      'All channels',
      'White label lead capture',
      '3 team seats'
    ]
  }
}

export function getPaddlePlanByPriceId(priceId: string): PaddlePlanConfig | undefined {
  return Object.values(PADDLE_PLANS).find(p => p.priceId === priceId)
}
