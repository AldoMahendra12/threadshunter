'use client'

import React, { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

interface ToggleProps {
  postId: string
  initialActive: boolean
}

export default function PostActiveToggleClient({ postId, initialActive }: ToggleProps) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const nextState = !active
    try {
      const { error } = await supabaseBrowser
        .from('monitored_posts')
        .update({ is_active: nextState })
        .eq('id', postId)

      if (error) throw error
      setActive(nextState)
    } catch (err: any) {
      alert(`Failed to update post status: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        active ? 'bg-[#7C3AED]' : 'bg-gray-700'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
