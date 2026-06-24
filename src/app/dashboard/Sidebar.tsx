'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Zap, Tv, Users, Settings, LogOut, Menu, X } from 'lucide-react'

interface SidebarProps {
  userEmail?: string
  fullName?: string
}

export default function Sidebar({ userEmail, fullName }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { name: 'Overview', href: '/dashboard', icon: Tv },
    { name: 'Leads', href: '/dashboard/leads', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-[#1A1D27] px-6 py-4 border-b border-[#2D3148] z-30 w-full shrink-0">
        <div className="flex items-center space-x-2">
          <Zap className="text-[#7C3AED] w-6 h-6" />
          <span className="font-bold text-white text-base">Threads Hunter</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white transition">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {open && (
        <div 
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`w-64 bg-[#1A1D27] border-r border-[#2D3148] flex flex-col justify-between fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6">
          <div className="flex items-center space-x-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-purple-500 flex items-center justify-center p-1.5 shadow">
              <Zap className="text-white w-full h-full" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Threads<span className="text-[#7C3AED]">Hunter</span>
            </span>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-[#7C3AED] text-white shadow shadow-purple-900/30' 
                      : 'text-gray-400 hover:bg-[#202433] hover:text-white'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-[#2D3148]/60 bg-[#151822]">
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-300 truncate">{fullName || 'Creator'}</p>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2.5 w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
