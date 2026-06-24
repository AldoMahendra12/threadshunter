'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Save, Sparkles } from 'lucide-react'

interface FormProps {
  userPlan: string
  metaAccessToken: string
}

export default function NewPostFormClient({ userPlan, metaAccessToken }: FormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [goal, setGoal] = useState<'freebie' | 'subscribe' | 'book_call' | 'custom'>('freebie')
  const [customGoalText, setCustomGoalText] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [channel, setChannel] = useState<'threads_comment' | 'instagram_dm' | 'both'>('threads_comment')
  const [loading, setLoading] = useState(false)

  // Helper to extract post ID from Threads URL
  const extractThreadsPostId = (urlInput: string): string => {
    try {
      const trimmed = urlInput.trim()
      if (!trimmed.startsWith('http')) return trimmed // Raw post ID
      
      const parsed = new URL(trimmed)
      const parts = parsed.pathname.split('/').filter(Boolean)
      
      if (parsed.pathname.includes('/post/')) {
        const idx = parts.indexOf('post')
        if (idx !== -1 && parts[idx + 1]) {
          return parts[idx + 1]
        }
      } else if (parts[0] === 't' && parts[1]) {
        return parts[1]
      }
      return parts[parts.length - 1] || trimmed
    } catch (e) {
      return urlInput.trim()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !ctaLink) return

    setLoading(true)
    const threadsPostId = extractThreadsPostId(url)

    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session?.user) throw new Error('Session not found, please sign in again')

      // Fetch actual post contents from Meta API if we have access token
      let postContent = 'Monitored Threads Post'
      if (metaAccessToken) {
        try {
          const res = await fetch(`https://graph.threads.net/v1.0/${threadsPostId}?fields=text&access_token=${metaAccessToken}`)
          if (res.ok) {
            const data = await res.json()
            postContent = data.text || postContent
          }
        } catch (e) {
          // ignore error and proceed with default content
        }
      }

      // Save post configuration to Supabase
      const { error } = await supabaseBrowser
        .from('monitored_posts')
        .insert({
          user_id: session.user.id,
          threads_post_id: threadsPostId,
          post_content: postContent,
          goal,
          custom_goal_text: goal === 'custom' ? customGoalText : null,
          cta_link: ctaLink.trim(),
          channel: userPlan === 'free' ? 'threads_comment' : channel, // Enforce comment-only for free tier
          is_active: true
        })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      alert(`Failed to monitor post: ${err.message || err}`)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Post URL */}
      <div>
        <label htmlFor="url" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          Threads Post URL or ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="url"
          required
          placeholder="https://www.threads.net/@username/post/C4s_BqyL1gB"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] transition"
        />
      </div>

      {/* Goal selection */}
      <div>
        <label htmlFor="goal" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          Campaign Conversion Goal
        </label>
        <select
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as any)}
          className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-[#7C3AED] transition"
        >
          <option value="freebie">Freebie Lead Magnet (Free Resource / PDF)</option>
          <option value="subscribe">Newsletter / Community Subscription</option>
          <option value="book_call">Book Call / Schedule Appointment</option>
          <option value="custom">Custom Goal</option>
        </select>
      </div>

      {/* Custom Goal text (conditional) */}
      {goal === 'custom' && (
        <div>
          <label htmlFor="customGoal" className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Custom Goal Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="customGoal"
            required
            rows={3}
            placeholder="Explain exactly what you want the liker to do (e.g., download our product trial, sign up for beta waitlist)..."
            value={customGoalText}
            onChange={(e) => setCustomGoalText(e.target.value)}
            className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] transition"
          />
        </div>
      )}

      {/* CTA link */}
      <div>
        <label htmlFor="cta" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          Call-To-Action Link <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          id="cta"
          required
          placeholder="https://yoursite.com/my-resource"
          value={ctaLink}
          onChange={(e) => setCtaLink(e.target.value)}
          className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] transition"
        />
        <p className="text-[10px] text-gray-500 mt-1">This is the final destination link. We will wrap it with a lead capture form link.</p>
      </div>

      {/* Delivery channel */}
      <div>
        <label htmlFor="channel" className="block text-xs font-bold text-gray-400 uppercase mb-2">
          Outreach Channels
        </label>
        {userPlan === 'free' ? (
          <div className="p-3 rounded-xl bg-gray-500/5 border border-[#2D3148] text-xs text-gray-400">
            Your current plan limits you to <span className="text-white font-semibold">Threads comment replies only</span>. Upgrade to access Instagram DMs.
          </div>
        ) : (
          <select
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="w-full bg-[#131620] border border-[#2D3148] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-[#7C3AED] transition"
          >
            <option value="threads_comment">Threads Comment Reply Only</option>
            <option value="instagram_dm">Instagram Direct Message (DM) Only</option>
            <option value="both">Both Threads Comment + Instagram DM</option>
          </select>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#7C3AED] hover:bg-purple-600 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center space-x-2 border border-purple-500/25 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        <span>{loading ? 'Configuring outreach...' : 'Save and Start Monitoring'}</span>
      </button>
    </form>
  )
}
