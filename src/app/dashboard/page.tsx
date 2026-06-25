import React from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Plus, 
  Heart, 
  Send, 
  MousePointerClick, 
  Users, 
  ArrowRight, 
  ExternalLink 
} from 'lucide-react'
import PostActiveToggleClient from './PostActiveToggleClient'
import DeletePostButtonClient from './DeletePostButtonClient'

export const dynamic = 'force-dynamic'

export default async function DashboardOverview() {
  const supabase = createClient()
  
  let user: any = null
  let posts: any[] = []
  let totalLikes = 0
  let totalSent = 0
  let totalLeads = 0
  let totalClicked = 0

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null
    user = authUser

    // Fetch monitored posts
    const { data: userPosts } = await supabase
      .from('monitored_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    posts = userPosts || []

    // Calculate sum aggregates
    posts.forEach(post => {
      totalLikes += post.total_likes || 0
      totalSent += post.total_messages_sent || 0
      totalLeads += post.total_leads || 0
    })

    // Fetch true click rate from messages_sent table
    const { count: clickedCount } = await supabase
      .from('messages_sent')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('was_clicked', true)

    totalClicked = clickedCount || 0
  } catch (err) {
    console.error('Failed to load dashboard overview data:', err)
  }

  const avgClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Track your Threads and Instagram outreach metrics.</p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="inline-flex items-center space-x-2 bg-[#7C3AED] hover:bg-purple-600 text-white font-semibold px-4.5 py-2.5 rounded-xl transition text-sm shadow shadow-purple-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Monitor New Post</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block">Total Likes Logged</span>
            <span className="text-2xl font-bold text-white mt-1 block">{totalLikes}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block">AI Messages Sent</span>
            <span className="text-2xl font-bold text-white mt-1 block">{totalSent}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block">Average Click Rate</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{avgClickRate}%</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block">Leads Captured</span>
            <span className="text-2xl font-bold text-white mt-1 block">{totalLeads}</span>
          </div>
        </div>
      </div>

      {/* Monitored Posts Section */}
      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#2D3148]">
          <h2 className="text-lg font-bold text-white">Monitored Posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-[#2D3148]/50 flex items-center justify-center text-gray-500 mx-auto mb-4">
              <ZapIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Monitored Posts Yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mt-2">
              Start by connecting a Threads post URL to launch automated AI outbound outreach.
            </p>
            <Link
              href="/dashboard/posts/new"
              className="mt-6 inline-flex items-center space-x-2 bg-[#7C3AED] hover:bg-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2D3148] text-xs font-bold text-gray-400 uppercase bg-[#141721]/50">
                  <th className="px-6 py-4">Post Description</th>
                  <th className="px-6 py-4">Goal</th>
                  <th className="px-6 py-4 text-center">Likes</th>
                  <th className="px-6 py-4 text-center">Outreach</th>
                  <th className="px-6 py-4 text-center">Leads</th>
                  <th className="px-6 py-4 text-center">Click Rate</th>
                  <th className="px-6 py-4 text-center">Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3148]/55">
                {posts.map((post) => {
                  // Calculate click rate per post
                  const postClickRate = post.total_messages_sent > 0 
                    ? ((post.total_leads / post.total_messages_sent) * 100) 
                    : 0
                  
                  let ctrColor = 'text-red-400'
                  if (postClickRate >= 20) ctrColor = 'text-green-400 font-bold'
                  else if (postClickRate >= 10) ctrColor = 'text-yellow-400 font-semibold'

                  return (
                    <tr key={post.id} className="hover:bg-[#1f2231]/30 transition">
                      <td className="px-6 py-4 max-w-xs font-medium text-gray-200">
                        <div className="truncate" title={post.post_content}>
                          {post.post_content || `Threads Post (${post.threads_post_id})`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.goal === 'freebie' ? 'bg-blue-500/10 text-blue-400' :
                          post.goal === 'subscribe' ? 'bg-purple-500/10 text-purple-400' :
                          post.goal === 'book_call' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {post.goal === 'book_call' ? 'Book Call' : post.goal}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">{post.total_likes}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{post.total_messages_sent}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{post.total_leads}</td>
                      <td className={`px-6 py-4 text-center ${ctrColor}`}>
                        {postClickRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <PostActiveToggleClient postId={post.id} initialActive={post.is_active} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DeletePostButtonClient postId={post.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
