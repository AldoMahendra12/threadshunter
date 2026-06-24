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
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-gray-400">
        <div className="text-center p-6 border border-[#2D3148] bg-[#1A1D27] rounded-xl max-w-sm">
          <h2 className="text-lg font-bold text-white mb-2">Invalid Lead Link</h2>
          <p className="text-sm">This link appears to be broken. Please check the URL and try again.</p>
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
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-gray-400">
        <div className="text-center p-6 border border-[#2D3148] bg-[#1A1D27] rounded-xl max-w-sm">
          <h2 className="text-lg font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-sm">We couldn't verify this reward link in our database.</p>
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

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-100 flex items-center justify-center px-4 relative overflow-hidden py-16">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#7C3AED] opacity-[0.06] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1D27] border border-[#2D3148] rounded-2xl shadow-2xl p-8 z-10 relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 text-[#7C3AED] border border-purple-500/25">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Claim Your Resource</h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your details below to unlock the resource from <span className="text-[#7C3AED] font-semibold">{ownerName}</span>.
          </p>
        </div>

        <CaptureFormClient refId={refId} postId={postId} />
      </div>
    </div>
  )
}
