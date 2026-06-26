'use client'

import React, { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { 
  Users, 
  MessageSquare, 
  UserCheck, 
  Edit3, 
  Check, 
  X, 
  Globe, 
  Smartphone 
} from 'lucide-react'

interface PostTabsClientProps {
  post: any
  likers: any[]
  versions: any[]
  leads: any[]
}

export default function PostTabsClient({ post, likers, versions, leads }: PostTabsClientProps) {
  const [activeTab, setActiveTab] = useState<'likers' | 'versions' | 'leads'>('likers')
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [localVersions, setLocalVersions] = useState(versions)

  const handleEditClick = (version: any) => {
    setEditingVersionId(version.id)
    setEditText(version.message_template)
  }

  const handleSaveEdit = async (versionId: string) => {
    if (!editText.trim()) return
    setLoading(true)

    try {
      const { error } = await supabaseBrowser
        .from('message_versions')
        .update({ message_template: editText.trim() })
        .eq('id', versionId)

      if (error) throw error

      setLocalVersions(prev => 
        prev.map(v => v.id === versionId ? { ...v, message_template: editText.trim() } : v)
      )
      setEditingVersionId(null)
    } catch (err: any) {
      alert(`Failed to update copy template: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="border-b border-[#2D3148] flex space-x-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('likers')}
          className={`pb-4 transition flex items-center space-x-2 ${
            activeTab === 'likers'
              ? 'border-b-2 border-[#7C3AED] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Commenters ({likers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-4 transition flex items-center space-x-2 ${
            activeTab === 'versions'
              ? 'border-b-2 border-[#7C3AED] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span>Message Copies ({localVersions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-4 transition flex items-center space-x-2 ${
            activeTab === 'leads'
              ? 'border-b-2 border-[#7C3AED] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4.5 h-4.5" />
          <span>Leads Captured ({leads.length})</span>
        </button>
      </div>

      {/* Tab 1: Commenters */}
      {activeTab === 'likers' && (
        <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl overflow-hidden shadow">
          {likers.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No comments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#2D3148] text-xs font-bold text-gray-400 uppercase bg-[#141721]/50">
                    <th className="px-6 py-4">Commenter Profile</th>
                    <th className="px-6 py-4">Comment Text</th>
                    <th className="px-6 py-4 text-center">Public Reply</th>
                    <th className="px-6 py-4 text-center">Instagram DM</th>
                    <th className="px-6 py-4 text-center">Clicked</th>
                    <th className="px-6 py-4 text-center">Converted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/55">
                  {likers.map((liker) => {
                    const messageLogs = liker.messages_sent || []
                    const commentSent = liker.public_reply_sent || messageLogs.some((m: any) => m.channel === 'threads_reply' || m.channel === 'threads_comment')
                    const dmSent = liker.instagram_dm_sent || messageLogs.some((m: any) => m.channel === 'instagram_dm')
                    const wasClicked = messageLogs.some((m: any) => m.was_clicked)
                    const wasConverted = messageLogs.some((m: any) => m.was_converted)

                    const isReplyEnabled = post.channel === 'both' || post.channel === 'threads_reply'
                    const isDmEnabled = post.channel === 'both' || post.channel === 'instagram_dm'

                    return (
                      <tr key={liker.id} className="hover:bg-[#1f2231]/30 transition">
                        <td className="px-6 py-4">
                          <a 
                            href={`https://www.threads.net/@${liker.liker_username}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-[#9F67FF] hover:underline"
                          >
                            @{liker.liker_username}
                          </a>
                          <div className="text-[10px] text-gray-500 mt-0.5 font-normal">Followers: {liker.liker_follower_count || 0}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-gray-300 font-semibold" title={liker.comment_text}>
                          {liker.comment_text ? `"${liker.comment_text}"` : <span className="text-gray-600 italic">No Text</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isReplyEnabled ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              commentSent ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700/30 text-gray-500'
                            }`}>
                              {commentSent ? '✅ Sent' : '⏳ Pending'}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isDmEnabled ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              dmSent ? 'bg-pink-500/10 text-pink-400' : 'bg-gray-700/30 text-gray-500'
                            }`}>
                              {dmSent ? '✅ Sent' : '⏳ Pending'}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            wasClicked ? 'bg-green-500/10 text-green-400' : 'bg-gray-700/30 text-gray-500'
                          }`}>
                            {wasClicked ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            wasConverted ? 'bg-[#7C3AED]/20 text-[#9F67FF]' : 'bg-gray-700/30 text-gray-500'
                          }`}>
                            {wasConverted ? 'YES' : 'NO'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Message Versions */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          {localVersions.length === 0 ? (
            <div className="bg-[#1A1D27] border border-[#2D3148] p-8 text-center text-gray-500 text-sm rounded-2xl">
              No outreach templates generated yet.
            </div>
          ) : (
            localVersions.map((version) => (
              <div 
                key={version.id} 
                className={`p-6 rounded-2xl bg-[#1A1D27] border transition ${
                  version.is_active ? 'border-[#7C3AED]/70 shadow-lg shadow-purple-950/10' : 'border-[#2D3148]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#2D3148]/60 pb-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-white">Version #{version.version_number}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      (version.channel === 'threads_reply' || version.channel === 'threads_comment') ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
                    }`}>
                      {(version.channel === 'threads_reply' || version.channel === 'threads_comment') ? 'Threads Reply' : 'Instagram DM'}
                    </span>
                    {version.is_active && (
                      <span className="bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-bold px-2 py-0.5 rounded">
                        Active Runner
                      </span>
                    )}
                  </div>
                  {!version.is_active && version.rewrite_reason && (
                    <span className="text-[10px] text-gray-500" title={version.rewrite_reason}>
                      Replaced by: {version.rewrite_reason}
                    </span>
                  )}
                </div>

                {editingVersionId === version.id ? (
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#131620] border border-[#2D3148] rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-[#7C3AED]"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingVersionId(null)}
                        className="p-1.5 rounded-lg border border-[#2D3148] hover:bg-gray-800 text-gray-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(version.id)}
                        disabled={loading}
                        className="inline-flex items-center space-x-1.5 bg-[#7C3AED] hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>{loading ? 'Saving...' : 'Save Template'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-gray-300 font-mono whitespace-pre-wrap">
                      {version.message_template}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#2D3148]/40 text-xs">
                      <div className="flex items-center space-x-6 text-gray-400">
                        <div>Sent: <span className="text-white font-semibold">{version.times_sent}</span></div>
                        <div>Clicks: <span className="text-white font-semibold">{version.times_clicked}</span></div>
                        <div>CTR: <span className={`font-bold ${version.click_rate >= 20 ? 'text-green-400' : 'text-gray-200'}`}>{version.click_rate}%</span></div>
                      </div>

                      {version.is_active && (
                        <button
                          onClick={() => handleEditClick(version)}
                          className="inline-flex items-center space-x-1 text-gray-400 hover:text-white transition font-bold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Override Template</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Leads */}
      {activeTab === 'leads' && (
        <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl overflow-hidden shadow">
          {leads.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No leads captured from this post yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#2D3148] text-xs font-bold text-gray-400 uppercase bg-[#141721]/50">
                    <th className="px-6 py-4">Captured Email</th>
                    <th className="px-6 py-4">WhatsApp Contact</th>
                    <th className="px-6 py-4">Captured At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/55">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#1f2231]/30 transition">
                      <td className="px-6 py-4 font-semibold text-gray-200">{lead.email}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {lead.whatsapp ? lead.whatsapp : <span className="text-gray-600 italic">None Provided</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(lead.captured_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
