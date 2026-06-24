'use client'

import { useEffect } from 'react'
import { initializePaddle } from '@paddle/paddle-js'

export default function PaddleInitializer() {
  useEffect(() => {
    const initPaddle = async () => {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
      const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox'

      if (!token) {
        console.warn('Paddle client token is missing. Please set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in environment variables.')
        return
      }

      try {
        await initializePaddle({
          environment: env,
          token: token,
        })
        console.log('Paddle.js initialized successfully.')
      } catch (error) {
        console.error('Failed to initialize Paddle.js:', error)
      }
    }

    initPaddle()
  }, [])

  return null
}
