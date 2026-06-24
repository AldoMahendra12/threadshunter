import React from 'react'
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import LeadsTableClient from './LeadsTableClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = createClient()
  let leads: any[] = []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/')

    // Fetch all leads across all monitored posts
    const { data: leadsData, error } = await supabase
      .from('leads')
      .select('*, monitored_posts(post_content, threads_post_id)')
      .eq('user_id', user.id)
      .order('captured_at', { ascending: false })

    if (error) {
      throw error
    }
    leads = leadsData || []
  } catch (err) {
    console.error('Failed to load leads list:', err)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Captured Leads</h1>
        <p className="text-gray-400 text-sm mt-1">Review contact information and download export logs.</p>
      </div>

      <LeadsTableClient leads={leads} />
    </div>
  )
}
