import React from 'react'
import { createClient } from '@/lib/supabase'
import { PADDLE_PLANS } from '@/lib/paddle'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  
  let user: any = null
  let profile: any = null

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/')
    user = authUser

    // Fetch user profile info
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) redirect('/')
    profile = userProfile
  } catch (err) {
    redirect('/dashboard')
  }

  const planId = profile.plan || 'free'
  const planConfig = PADDLE_PLANS[planId]
  const limit = planConfig ? planConfig.messagesLimit : 50
  const limitDisplay = limit === Infinity ? 'Unlimited' : limit
  const count = profile.messages_sent_this_month || 0
  const progressPercent = limit === Infinity ? 0 : Math.min(100, (count / limit) * 100)

  const isMetaConnected = !!profile.meta_access_token

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure external channel integrations and monitor subscriptions.</p>
      </div>

      {/* Plan Card */}
      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Active Subscription Tier</span>
          <div className="flex items-center space-x-3 mt-1.5">
            <span className="text-2xl font-black text-white capitalize">{planId}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              planId === 'free' ? 'bg-gray-700/50 text-gray-400' : 'bg-purple-500/10 text-purple-400'
            }`}>
              {profile.stripe_subscription_status || 'Active'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Your current plan provides access to {planConfig?.features[2]} and limits outreach volume to {limitDisplay} message{limit !== 1 ? 's' : ''} per month.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
            <span>MONTHLY USAGE</span>
            <span>{count} / {limitDisplay} Messages</span>
          </div>
          {limit !== Infinity ? (
            <div className="w-full bg-[#131620] h-2.5 rounded-full overflow-hidden border border-[#2D3148]/60">
              <div 
                className="bg-gradient-to-r from-[#7C3AED] to-purple-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-green-500/5 border border-green-500/20 py-2 rounded-xl text-center text-xs font-bold text-green-400">
              Infinite Outreach Allowed
            </div>
          )}
          <p className="text-[10px] text-gray-500 mt-2 text-right">
            Usage counts reset on: {profile.month_reset_at ? new Date(profile.month_reset_at).toLocaleDateString() : '1st of the month'}
          </p>
        </div>
      </div>

      {/* Settings Client Actions wrapper */}
      <SettingsClient
        profileId={profile.id}
        isMetaConnected={isMetaConnected}
        threadsUserId={profile.threads_user_id || ''}
        instagramUserId={profile.instagram_user_id || ''}
      />
    </div>
  )
}
