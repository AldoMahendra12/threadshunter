import React from 'react'
import { createClient } from '@/lib/supabase'
import { PADDLE_PLANS } from '@/lib/paddle'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NewPostFormClient from './NewPostFormClient'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const supabase = createClient()
  
  let user: any = null
  let profile: any = null
  let currentCount = 0

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/')
    user = authUser

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) redirect('/')
    profile = userProfile

    // Fetch user current monitored posts count
    const { count } = await supabase
      .from('monitored_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    currentCount = count || 0
  } catch (err) {
    redirect('/dashboard')
  }

  const userPlan = profile.plan || 'free'
  const planConfig = PADDLE_PLANS[userPlan]
  const postsLimit = planConfig ? planConfig.postsLimit : 1
  const limitExceeded = currentCount >= postsLimit

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Overview</span>
      </Link>

      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Monitor New Threads Post</h1>
        <p className="text-sm text-gray-400 mb-6">Connect a post URL and set your conversion goal.</p>

        {limitExceeded ? (
          <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm space-y-4">
            <h4 className="font-bold">Upgrade Required</h4>
            <p>
              Your current <span className="capitalize font-semibold">{userPlan}</span> plan allows monitoring up to <span className="font-semibold">{postsLimit}</span> post{postsLimit > 1 ? 's' : ''}. You are already monitoring <span className="font-semibold">{currentCount}</span>.
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-[#7C3AED] hover:bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Upgrade Your Account
            </Link>
          </div>
        ) : (
          <NewPostFormClient userPlan={userPlan} metaAccessToken={profile.meta_access_token || ''} />
        )}
      </div>
    </div>
  )
}
