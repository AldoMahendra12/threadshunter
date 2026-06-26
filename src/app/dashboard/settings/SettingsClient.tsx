'use client'

import React, { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Unlink, RefreshCw, CreditCard, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SettingsClientProps {
  profileId: string
  isMetaConnected: boolean
  threadsUserId: string
  instagramUserId: string
}

export default function SettingsClient({ 
  profileId, 
  isMetaConnected, 
  threadsUserId, 
  instagramUserId 
}: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(isMetaConnected)

  const isBypass = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === 'true'

  const handleSetPlan = async (targetPlan: 'free' | 'starter' | 'pro' | 'scale') => {
    setLoading(true)
    try {
      const { error } = await supabaseBrowser
        .from('profiles')
        .update({ plan: targetPlan })
        .eq('id', profileId)

      if (error) throw error
      alert(`Plan updated to ${targetPlan} successfully!`)
      window.location.reload()
    } catch (err: any) {
      alert(`Failed to update plan: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Meta account? Automation will stop working.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabaseBrowser
        .from('profiles')
        .update({
          meta_access_token: null,
          meta_token_expires_at: null,
          threads_user_id: null,
          instagram_user_id: null
        })
        .eq('id', profileId)

      if (error) throw error
      setConnected(false)
      alert('Meta account disconnected successfully')
    } catch (err: any) {
      alert(`Failed to disconnect: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReconnect = () => {
    setLoading(true)
    // Redirect manually to our custom Threads OAuth flow
    window.location.href = '/api/auth/threads'
  }

  return (
    <div className="space-y-6">
      {/* Meta Connections Card */}
      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Meta Channel Connections</h3>
        
        {connected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/25 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-green-400">Connected to Meta Graph API</p>
                <div className="text-xs text-gray-400 mt-2 space-y-1">
                  <div>Threads User ID: <span className="font-mono text-gray-200">{threadsUserId || 'N/A'}</span></div>
                  {instagramUserId && (
                    <div>Instagram User ID: <span className="font-mono text-gray-200">{instagramUserId}</span></div>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                ACTIVE
              </span>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleReconnect}
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconnect Token</span>
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="inline-flex items-center space-x-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#131620] border border-[#2D3148] text-xs text-gray-400">
              No Threads account connected. Connect your Threads Creator account to launch outbound leads automation.
            </div>
            <button
              onClick={handleReconnect}
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-[#7C3AED] hover:bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow shadow-purple-900/30 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Connect Threads Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Dev Plan Switcher (Only visible in dev or when bypass enabled) */}
      {isBypass && (
        <div className="bg-[#1A1D27] border border-orange-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-500/20 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase">
            Development Tool
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Dev Tool: Plan Bypass Selector</h3>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Instantly switch plans to test starter/pro/scale features and bypass Paddle checks.
          </p>

          <div className="flex flex-wrap gap-3">
            {(['free', 'starter', 'pro', 'scale'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleSetPlan(p)}
                disabled={loading}
                className="bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50 capitalize"
              >
                Set {p} Plan
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Billing Actions Card */}
      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Billing and Portal Management</h3>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Manage subscriptions, update payment cards, view invoice history, or cancel your automated outreach plans.
        </p>

        <Link
          href="/api/paddle/create-portal"
          className="inline-flex items-center space-x-2 bg-[#7C3AED] hover:bg-purple-600 text-white text-xs font-bold px-4.5 py-3 rounded-xl transition shadow shadow-purple-900/30"
        >
          <CreditCard className="w-4 h-4" />
          <span>Manage Billing & Subscriptions</span>
        </Link>
      </div>
    </div>
  )
}
