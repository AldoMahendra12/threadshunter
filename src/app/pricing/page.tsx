import React from 'react'
import { createClient } from '@/lib/supabase'
import { PADDLE_PLANS } from '@/lib/paddle'
import { CheckCircle2, Zap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = createClient()
  
  let isLoggedIn = false
  let userPlan = 'free'

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      isLoggedIn = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        userPlan = profile.plan || 'free'
      }
    }
  } catch (err) {
    // Session fetching failed, treat as logged out
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-100 font-sans relative overflow-hidden py-20 px-6">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.05] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <Link href="/" className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Zap className="text-[#7C3AED] w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-white">
              Threads<span className="text-[#7C3AED]">Hunter</span>
            </span>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            Flexible plans for growth
          </h1>
          <p className="text-gray-400 mt-4 text-lg">
            Choose the plan that suits your scale. Upgrade or downgrade as your user base expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          {Object.values(PADDLE_PLANS).map((plan) => {
            const isCurrent = isLoggedIn && userPlan === plan.id
            const isFree = plan.id === 'free'
            const hasPaidPlan = isLoggedIn && userPlan !== 'free'

            let ctaText = 'Get Started'
            let ctaHref = `/api/paddle/create-checkout?plan=${plan.id}`

            if (isCurrent) {
              ctaText = 'Your Current Plan'
              ctaHref = '/dashboard'
            } else if (hasPaidPlan) {
              // If on a paid plan, direct users to billing portal
              ctaText = 'Manage Subscription'
              ctaHref = '/api/paddle/create-portal'
            } else if (isFree) {
              ctaText = 'Sign Up Free'
              ctaHref = '/dashboard'
            }

            return (
              <div 
                key={plan.id}
                className={`p-8 rounded-2xl bg-[#1A1D27] border flex flex-col justify-between relative ${
                  plan.id === 'pro' 
                    ? 'border-[#7C3AED] md:scale-105 shadow-xl shadow-purple-950/20 z-10' 
                    : 'border-[#2D3148]'
                }`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#7C3AED] text-white text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white capitalize">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-5xl font-extrabold">
                      {isFree ? '$0' : plan.id === 'starter' ? '$29' : plan.id === 'pro' ? '$59' : '$99'}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">/mo</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-3">
                    {plan.id === 'free' && 'Perfect to test the system.'}
                    {plan.id === 'starter' && 'For creators starting lead outreach.'}
                    {plan.id === 'pro' && 'Our complete marketing machine.'}
                    {plan.id === 'scale' && 'For high volume creators and agencies.'}
                  </p>

                  <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-2.5">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.id === 'pro' ? 'text-[#7C3AED]' : 'text-green-500'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <Link
                      href={ctaHref}
                      className="w-full block text-center bg-[#2D3148] hover:bg-gray-700 text-white py-3 rounded-xl text-xs font-bold transition cursor-default pointer-events-none"
                    >
                      {ctaText}
                    </Link>
                  ) : (
                    <Link
                      href={ctaHref}
                      className={`w-full block text-center py-3 rounded-xl text-xs font-bold transition ${
                        plan.id === 'pro'
                          ? 'bg-[#7C3AED] hover:bg-purple-600 text-white shadow-lg shadow-purple-950/30'
                          : 'bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white'
                      }`}
                    >
                      {ctaText}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
