import React from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import CaptureFormClient from './CaptureFormClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    ref?: string
    post?: string
  }
}

export default async function CapturePage({ searchParams }: PageProps) {
  const refId = searchParams.ref
  const postId = searchParams.post

  if (!refId || !postId) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-gray-400 font-sans">
        <div className="text-center p-6 border border-[#2D3148] bg-[#1A1D27] rounded-2xl max-w-sm shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-400">This referral link appears to be broken or incomplete.</p>
        </div>
      </div>
    )
  }

  // Look up monitored post and its creator details
  const { data: post, error: postErr } = await supabaseAdmin
    .from('monitored_posts')
    .select('*, profiles(*)')
    .eq('id', postId)
    .maybeSingle()

  const { data: liker, error: likerErr } = await supabaseAdmin
    .from('likers')
    .select('*')
    .eq('id', refId)
    .maybeSingle()

  if (postErr || likerErr || !post || !liker) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-gray-400 font-sans">
        <div className="text-center p-6 border border-[#2D3148] bg-[#1A1D27] rounded-2xl max-w-sm shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-sm text-gray-400">We couldn't verify this gift link in our database.</p>
        </div>
      </div>
    )
  }

  // Log link click when page loads
  const { data: msg } = await supabaseAdmin
    .from('messages_sent')
    .select('*')
    .eq('liker_id', refId)
    .eq('post_id', postId)
    .maybeSingle()

  if (msg && !msg.was_clicked) {
    // 1. Mark as clicked
    await supabaseAdmin
      .from('messages_sent')
      .update({
        was_clicked: true,
        clicked_at: new Date().toISOString()
      })
      .eq('id', msg.id)

    // 2. Increment times_clicked in message_versions
    if (msg.message_version_id) {
      const { data: vObj } = await supabaseAdmin
        .from('message_versions')
        .select('times_clicked')
        .eq('id', msg.message_version_id)
        .single()

      await supabaseAdmin
        .from('message_versions')
        .update({
          times_clicked: (vObj?.times_clicked || 0) + 1
        })
        .eq('id', msg.message_version_id)
    }
  }

  const ownerName = post.profiles?.full_name || 'Creator'

  // Resolve goal-based headline
  let goalHeadline = 'Your special gift is ready'
  if (post.goal === 'freebie') {
    goalHeadline = 'Your free resource is ready'
  } else if (post.goal === 'subscribe') {
    goalHeadline = 'Join other getting exclusive updates'
  } else if (post.goal === 'book_call') {
    goalHeadline = 'Your free call is one step away'
  } else if (post.goal === 'custom' && post.custom_goal_text) {
    goalHeadline = post.custom_goal_text
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-100 flex items-center justify-center px-4 relative overflow-hidden py-16 font-sans">
      {/* Background radial ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#7C3AED] to-purple-800 opacity-[0.08] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1D27]/85 backdrop-blur-md border border-[#2D3148] rounded-2xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <span className="text-[#9F67FF] font-semibold text-sm tracking-wide uppercase block mb-1">
            {ownerName} sent you something special 🎁
          </span>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            {goalHeadline}
          </h2>
        </div>

        <CaptureFormClient refId={refId} postId={postId} />

        <div className="text-center mt-6 text-xs text-gray-500 flex items-center justify-center space-x-1">
          <span>🔒 No spam. Unsubscribe anytime.</span>
        </div>
      </div>
    </div>
  )
}

