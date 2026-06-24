import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not defined in environment variables.')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder-key',
})

export const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022' // Standard identifier for Claude 3.5 Sonnet
