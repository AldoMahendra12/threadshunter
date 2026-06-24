'use client'

import React from 'react'
import { Download, Mail, Phone, Calendar } from 'lucide-react'

interface LeadsTableProps {
  leads: any[]
}

export default function LeadsTableClient({ leads }: LeadsTableProps) {
  const handleExportCSV = () => {
    if (leads.length === 0) return

    const csvHeaders = ['Email', 'WhatsApp', 'Source Post ID', 'Source Post Content', 'Captured At']
    const csvRows = leads.map(l => [
      l.email,
      l.whatsapp || '',
      l.source_post_id || '',
      (l.monitored_posts?.post_content || '').replace(/,/g, ' '), // escape commas
      new Date(l.captured_at).toLocaleString()
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [csvHeaders.join(','), ...csvRows.map(r => r.map(val => `"${val}"`).join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `threads_hunter_leads_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Table Card */}
      <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#2D3148] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Captured Leads ({leads.length})</h2>
          {leads.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            No leads captured yet. Your conversion funnel will log opt-ins here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2D3148] text-xs font-bold text-gray-400 uppercase bg-[#141721]/50">
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Source Post</th>
                  <th className="px-6 py-4">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3148]/55">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1f2231]/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-semibold text-gray-200">{lead.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.whatsapp ? (
                        <div className="flex items-center space-x-2.5">
                          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-gray-300">{lead.whatsapp}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs text-gray-400">
                      <div className="truncate" title={lead.monitored_posts?.post_content}>
                        {lead.monitored_posts?.post_content || `Post ID: ${lead.source_post_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(lead.captured_at).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
