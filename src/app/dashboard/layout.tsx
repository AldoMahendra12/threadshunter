import React from 'react'
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'

export const dynamic = 'force-dynamic'

interface LayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: LayoutProps) {
  const supabase = createClient()
  
  let user: any = null
  let profile: any = null

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) {
      redirect('/')
    }
    user = authUser

    // Fetch user profile name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    profile = userProfile
  } catch (err) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-100 flex flex-col md:flex-row relative">
      <Sidebar userEmail={user.email} fullName={profile?.full_name || ''} />
      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  )
}
