import React from 'react'
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Calendar, Target } from 'lucide-react'
import PostTabsClient from './PostTabsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = params
  const supabase = createClient()

  let post: any = null
  let likers: any[] = []
  let versions: any[] = []
  let leads: any[] = []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/')

    // Fetch the monitored post
    const { data: monitoredPost, error: postErr } = await supabase
      .from('monitored_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (postErr || !monitoredPost) {
      redirect('/dashboard')
    }
    post = monitoredPost

    // Fetch likers with messages sent and captured leads
    const { data: likersData } = await supabase
      .from('likers')
      .select('*, messages_sent(*), leads(*)')
      .eq('post_id', id)
      .order('liked_at', { ascending: false })

    likers = likersData || []

    // Fetch message templates/versions
    const { data: versionsData } = await supabase
      .from('message_versions')
      .select('*')
      .eq('post_id', id)
      .order('version_number', { ascending: false })

    versions = versionsData || []

    // Fetch captured leads
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('source_post_id', id)
      .order('captured_at', { ascending: false })

    leads = leadsData || []

  } catch (err) {
    redirect('/dashboard')
  }

  // Calculate CTR
  const ctr = post.total_messages_sent > 0 
    ? ((post.total_leads / post.total_messages_sent) * 100).toFixed(1) 
    : '0.0'

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#1A1D27] p-6 rounded-2xl border border-[#2D3148]">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white max-w-md truncate" title={post.post_content}>
                {post.post_content || `Threads Post: ${post.threads_post_id}`}
              </h1>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                post.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {post.is_active ? 'Monitoring Active' : 'Paused'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-purple-400" />
                <span>Goal: <span className="text-gray-200 capitalize font-medium">{post.goal === 'book_call' ? 'Book Call' : post.goal}</span></span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Monitored since: {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <a 
                href={`https://www.threads.net/t/${post.threads_post_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-[#7C3AED] hover:underline"
              >
                <span>View Original Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-6 shrink-0 bg-[#0F1117]/60 px-6 py-4 rounded-xl border border-[#2D3148]/60">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Outreach</span>
              <span className="text-base font-bold text-white mt-1 block">{post.total_messages_sent}</span>
            </div>
            <div className="h-8 w-px bg-[#2D3148]" />
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Leads</span>
              <span className="text-base font-bold text-white mt-1 block">{post.total_leads}</span>
            </div>
            <div className="h-8 w-px bg-[#2D3148]" />
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">CTR</span>
              <span className="text-base font-bold text-green-400 mt-1 block">{ctr}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <PostTabsClient post={post} likers={likers} versions={versions} leads={leads} />
    </div>
  )
}
