'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface CaptureFormProps {
  refId: string
  postId: string
}

export default function CaptureFormClient({ refId, postId }: CaptureFormProps) {
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId, postId, email, whatsapp })
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setSuccess(true)
      
      // Fire confetti celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/'
      }, 2000)

    } catch (err: any) {
      alert(`Submission failed: ${err.message || err}`)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Success!</h3>
        <p className="text-xs text-gray-400 mt-1">Redirecting you to your resource...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          Your email address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] transition"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          WhatsApp (optional)
        </label>
        <input
          type="tel"
          id="whatsapp"
          placeholder="+1 (555) 000-0000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 bg-gradient-to-r from-[#7C3AED] to-purple-600 hover:from-[#6D28D9] hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center space-x-2 border border-purple-500/20 disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        <span>{loading ? 'Verifying...' : 'Get it now →'}</span>
      </button>
    </form>
  )
}
