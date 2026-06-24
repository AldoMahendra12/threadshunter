// OpenRouter adapter to mimic Anthropic SDK and use free models
// This avoids rewriting the rest of the codebase where anthropic.messages.create is used.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// You can use free models like llama-3-8b, gemma-2-9b, or mistral-7b
export const ANTHROPIC_MODEL = 'meta-llama/llama-3-8b-instruct:free'

interface MessageCreateParams {
  model: string
  max_tokens?: number
  system?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

class MockAnthropic {
  messages = {
    create: async (params: MessageCreateParams) => {
      // If OpenRouter API Key is present, use OpenRouter
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
        const systemMessage = params.system ? [{ role: 'system', content: params.system }] : []
        const formattedMessages = [
          ...systemMessage,
          ...params.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ]

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              'X-Title': 'Threads Hunter'
            },
            body: JSON.stringify({
              model: ANTHROPIC_MODEL,
              messages: formattedMessages,
            })
          })

          if (!response.ok) {
            const errText = await response.text()
            throw new Error(`OpenRouter API error: ${response.status} - ${errText}`)
          }

          const data = await response.json()
          const choiceText = data.choices?.[0]?.message?.content || ''

          // Mimic Anthropic's SDK return format
          return {
            content: [
              {
                type: 'text',
                text: choiceText
              }
            ]
          }
        } catch (error) {
          console.error('Error calling OpenRouter API:', error)
          throw error
        }
      } 
      
      // Otherwise, fall back to standard Anthropic if its key is present
      if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your-anthropic-claude-api-key') {
        // Dynamic import to avoid loading Anthropic SDK when not used/installed
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const realClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
        
        // Map model back to Claude if using the real SDK
        const realModel = 'claude-3-5-sonnet-20241022'
        return realClient.messages.create({
          ...params,
          model: realModel
        })
      }

      throw new Error('No valid API key found. Please set either OPENROUTER_API_KEY or ANTHROPIC_API_KEY in .env.local')
    }
  }
}

export const anthropic = new MockAnthropic()
