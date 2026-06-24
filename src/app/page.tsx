'use client'

import React, { useState, useRef, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { PLANS } from '@/lib/stripe'
import { 
  Tv, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Zap 
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThreeDMarquee } from '@/components/ui/3d-marquee'
import InfiniteMovingCardsDemo from '@/components/infinite-moving-cards-demo'
import { Timeline } from '@/components/ui/timeline'
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar'
import { CanvasText } from '@/components/ui/canvas-text'

// Stagger animation container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
}

// Custom moving border gradient button
const MovingBorderButton = ({ onClick, disabled, className, children }: { onClick?: () => void, disabled?: boolean, className?: string, children: React.ReactNode }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-[1.5px] overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-900/30 transition-all duration-300 group disabled:opacity-50 shrink-0 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition duration-[3000ms] animate-pulse" />
      <div className="relative px-8 py-4 bg-[#0F1117] rounded-xl text-white font-bold transition duration-300 group-hover:bg-[#151824] flex items-center justify-center space-x-2 text-base">
        {children}
      </div>
    </button>
  )
}

const steps: CardItem[] = [
  {
    id: 1,
    step: "01",
    title: "Connect Meta API",
    content: "Log in with Facebook OAuth to securely authorize your connected Instagram Creator and Threads channels. We import your credentials into a secured profiles record."
  },
  {
    id: 2,
    step: "02",
    title: "Monitor Your Post",
    content: "Paste the Threads URL, specify your promotion goal (freebie, subscribe, etc.), and provide your final CTA redirect link in our monitored posts dashboard."
  },
  {
    id: 3,
    step: "03",
    title: "AI Outreach Triggered",
    content: "When someone likes the post, Claude drafts a personalized comment/DM matching their bio details and publishes it automatically to capture high-intent leads."
  },
  {
    id: 4,
    step: "04",
    title: "Capture & Learn",
    content: "Visitors opt in via the capture form to unlock the resource. AI monitors click-through rates and auto-rewrites weaker copies every 24 hours to maximize conversion rates."
  }
]

const marqueeImages = [
  "https://assets.aceternity.com/cloudinary_bkp/3d-card.png",
  "https://assets.aceternity.com/animated-modal.png",
  "https://assets.aceternity.com/animated-testimonials.webp",
  "https://assets.aceternity.com/cloudinary_bkp/Tooltip_luwy44.png",
  "https://assets.aceternity.com/github-globe.png",
  "https://assets.aceternity.com/glare-card.png",
  "https://assets.aceternity.com/layout-grid.png",
  "https://assets.aceternity.com/flip-text.png",
  "https://assets.aceternity.com/hero-highlight.png",
  "https://assets.aceternity.com/carousel.webp",
  "https://assets.aceternity.com/placeholders-and-vanish-input.png",
  "https://assets.aceternity.com/shooting-stars-and-stars-background.png",
  "https://assets.aceternity.com/signup-form.png",
  "https://assets.aceternity.com/cloudinary_bkp/stars_sxle3d.png",
  "https://assets.aceternity.com/spotlight-new.webp",
  "https://assets.aceternity.com/cloudinary_bkp/Spotlight_ar5jpr.png",
  "https://assets.aceternity.com/cloudinary_bkp/Parallax_Scroll_pzlatw_anfkh7.png",
  "https://assets.aceternity.com/tabs.png",
  "https://assets.aceternity.com/cloudinary_bkp/Tracing_Beam_npujte.png",
  "https://assets.aceternity.com/cloudinary_bkp/typewriter-effect.png",
  "https://assets.aceternity.com/glowing-effect.webp",
  "https://assets.aceternity.com/hover-border-gradient.png",
  "https://assets.aceternity.com/cloudinary_bkp/Infinite_Moving_Cards_evhzur.png",
  "https://assets.aceternity.com/cloudinary_bkp/Lamp_hlq3ln.png",
  "https://assets.aceternity.com/macbook-scroll.png",
  "https://assets.aceternity.com/cloudinary_bkp/Meteors_fye3ys.png",
  "https://assets.aceternity.com/cloudinary_bkp/Moving_Border_yn78lv.png",
  "https://assets.aceternity.com/multi-step-loader.png",
  "https://assets.aceternity.com/vortex.png",
  "https://assets.aceternity.com/wobble-card.png",
  "https://assets.aceternity.com/world-map.webp",
]

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Features', link: '#features' },
    { name: 'How it Works', link: '#how-it-works' },
    { name: 'Pricing', link: '#pricing' },
  ]

  const handleMetaLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'facebook', // Facebook handles Meta OAuth scopes
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            scopes: 'instagram_basic,instagram_manage_messages,threads_basic,threads_content_publish'
          }
        }
      })
      if (error) throw error
    } catch (err: any) {
      alert(`OAuth login failed: ${err.message || err}`)
      setLoading(false)
    }
  }

  // Timeline Content Definition
  const timelineData = [
    {
      title: "Connect Meta",
      content: (
        <div>
          <p className="text-gray-300 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-xl">
            Log in with Facebook OAuth to securely authorize your connected Instagram Creator and Threads channels. We import your credentials into a secured profiles record.
          </p>
          <div className="rounded-2xl p-6 bg-[#131620] border border-[#2D3148] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-[#0F1117] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Meta Authorization</h4>
                <p className="text-emerald-400 text-sm font-medium flex items-center mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" /> Connected successfully
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Monitor Post",
      content: (
        <div>
          <p className="text-gray-300 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-xl">
            Paste the Threads URL, specify your promotion goal (freebie, subscribe, etc.), and provide your final CTA redirect link in our monitored posts dashboard.
          </p>
          <div className="rounded-2xl bg-[#131620] border border-[#2D3148] shadow-2xl overflow-hidden group">
            <div className="border-b border-[#2D3148] p-4 bg-[#1A1D27] flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-4 px-3 py-1 bg-[#0F1117] rounded text-xs text-gray-400 font-mono flex-1 truncate">
                https://www.threads.net/@creator/post/C...
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-[#202433] rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-[#202433] rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-[#202433] rounded w-5/6 animate-pulse" />
              <div className="mt-6 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                <p className="text-purple-300 text-sm font-medium">Tracking Active: 1,402 likes detected</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "AI Outreach",
      content: (
        <div>
          <p className="text-gray-300 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-xl">
            When someone likes the post, Claude drafts a personalized comment or DM matching their bio details and publishes it automatically.
          </p>
          <div className="rounded-2xl p-6 bg-[#131620] border border-[#2D3148] shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                <div className="bg-[#202433] p-3 rounded-2xl rounded-bl-sm text-sm text-gray-300 max-w-[80%]">
                  Liked your post! ❤️
                </div>
              </div>
              <div className="flex gap-3 items-end justify-end">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-2xl rounded-br-sm text-sm text-white max-w-[80%] shadow-lg shadow-purple-900/20">
                  Hey Sarah! Saw you're also a designer in NYC. Thanks for the like on my typography post. Here's the link to the font pack I mentioned! ✨
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Learn & Earn",
      content: (
        <div>
          <p className="text-gray-300 text-sm md:text-lg font-normal mb-8 leading-relaxed max-w-xl">
            AI monitors click-through rates and auto-rewrites weaker copies every 24 hours to maximize your conversion rates on autopilot.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#131620] p-5 border border-[#2D3148]">
              <div className="text-gray-400 text-xs font-semibold mb-1">Conversion Rate</div>
              <div className="text-3xl font-black text-white">14.2%</div>
              <div className="text-emerald-400 text-xs mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +2.4% today
              </div>
            </div>
            <div className="rounded-xl bg-[#131620] p-5 border border-[#2D3148]">
              <div className="text-gray-400 text-xs font-semibold mb-1">Leads Captured</div>
              <div className="text-3xl font-black text-[#9F67FF]">2,845</div>
              <div className="text-purple-400 text-xs mt-2 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Automated
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-100 font-sans selection:bg-[#7C3AED] selection:text-white overflow-x-hidden">
      {/* Background Glows (Aceternity style blobs) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[500px] h-[500px] bg-purple-600 opacity-[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[50%] left-1/3 w-[600px] h-[600px] bg-indigo-900 opacity-[0.04] rounded-full blur-[130px] pointer-events-none" />

      {/* Resizable Navbar */}
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-3">
            <NavbarButton variant="secondary" as="button" onClick={handleMetaLogin}>
              Sign In
            </NavbarButton>
            <NavbarButton variant="primary" as="button" onClick={handleMetaLogin}>
              {loading ? 'Connecting...' : 'Connect Meta'}
            </NavbarButton>
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {item.name}
              </a>
            ))}
            <div className="flex w-full flex-col gap-3 pt-2">
              <NavbarButton variant="secondary" as="button" onClick={handleMetaLogin} className="w-full">
                Sign In
              </NavbarButton>
              <NavbarButton variant="primary" as="button" onClick={handleMetaLogin} className="w-full">
                {loading ? 'Connecting...' : 'Connect Meta'}
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center relative z-10 overflow-visible">
        {/* 3D Marquee Background */}
        <div className="absolute w-screen left-1/2 -translate-x-1/2 -top-40 -bottom-40 -z-10 opacity-[0.45] pointer-events-none overflow-hidden [mask-image:radial-gradient(circle_at_center,white_35%,transparent_75%)]">
          <ThreeDMarquee images={marqueeImages} />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-[#1A1D27] border border-[#2D3148] px-4 py-2 rounded-full text-xs font-semibold text-purple-400 mb-2 shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-gen AI outreach automation for Threads & Instagram</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.1]"
          >
            Turn Threads Likes into <br />
            <span className="bg-gradient-to-r from-[#9F67FF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
              Automated Leads
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Stop missing opportunities. Threads Hunter monitors your posts, builds personalized AI replies based on likers' bios, and delivers leads straight to DMs or comments automatically.
          </motion.p>

          {/* Actions */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-4"
          >
            <MovingBorderButton onClick={handleMetaLogin} disabled={loading} className="w-full sm:w-auto">
              <span>{loading ? 'Starting...' : 'Start Free Trial'}</span>
              <ArrowRight className="w-5 h-5" />
            </MovingBorderButton>
            
            <MovingBorderButton className="w-full sm:w-auto">
              <a href="#pricing" className="flex items-center space-x-2">
                <span>View Pricing</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </MovingBorderButton>
          </motion.div>


          {/* Visual Mockup Dashboard (with Framer Motion fade-up trigger) */}
          <motion.div 
            variants={itemVariants}
            className="relative max-w-5xl mx-auto rounded-2xl border border-[#2D3148] bg-[#1A1D27] p-4 shadow-2xl shadow-purple-950/20 overflow-hidden pt-10"
          >
            <div className="absolute top-0 left-0 right-0 h-10 bg-[#0F1117] border-b border-[#2D3148] px-4 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-gray-500 pl-4 font-mono">threadshunter.com/dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-xl bg-[#131620] border border-[#2D3148]/50 hover:border-purple-500/20 transition-all duration-300">
                <span className="text-xs font-semibold text-gray-400">Total Likes Logged</span>
                <div className="text-2xl font-bold text-white mt-1">12,482</div>
                <span className="text-xs text-green-400 font-medium flex items-center mt-2">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> +24% this week
                </span>
              </div>
              <div className="p-5 rounded-xl bg-[#131620] border border-[#2D3148]/50 hover:border-purple-500/20 transition-all duration-300">
                <span className="text-xs font-semibold text-gray-400">AI Outreach Sent</span>
                <div className="text-2xl font-bold text-white mt-1">4,902</div>
                <span className="text-xs text-purple-400 font-medium mt-2 block">Success Rate 98.4%</span>
              </div>
              <div className="p-5 rounded-xl bg-[#131620] border border-[#2D3148]/50 hover:border-purple-500/20 transition-all duration-300">
                <span className="text-xs font-semibold text-gray-400">Average Click Rate</span>
                <div className="text-2xl font-bold text-[#22C55E] mt-1">21.8%</div>
                <span className="text-xs text-[#EAB308] font-medium mt-2 block">Optimizing live copy...</span>
              </div>
            </div>

            {/* Interactive Preview Container */}
            <div className="mt-6 border-t border-[#2D3148]/60 pt-6 text-left">
              <h4 className="text-sm font-bold text-gray-300 mb-3 px-1">Live Automation Activity</h4>
              <div className="space-y-3 bg-[#0F1117] p-4 rounded-xl border border-[#2D3148]/80 text-xs">
                <div className="flex items-start justify-between border-b border-[#2D3148]/40 pb-3">
                  <div>
                    <span className="text-purple-400 font-bold">@sarah_codes</span>
                    <span className="text-gray-500"> liked Threads post: "My checklist for launching NextJS SaaS in 24 hours"</span>
                  </div>
                  <span className="text-gray-500">2s ago</span>
                </div>
                <div className="flex items-start space-x-2 pt-1 text-gray-300 bg-[#1A1D27]/55 p-3 rounded-lg border border-purple-500/20">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-purple-300">Generated AI Message (Comment/DM):</div>
                    <p className="mt-1 leading-relaxed">
                      "@sarah_codes Hey Sarah! Love your focus on building SaaS. Since you're looking into launch speed, thought you might like my template: threadshunter.com/capture?ref=mock-1"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section (with stagger cards) */}
      <section id="features" className="bg-[#131620] border-y border-[#2D3148] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Outreach engineered for conversions</h2>
            <p className="text-gray-400 mt-4">Automate your inbound funnel completely inside Next.js with state of the art Claude 3.5 Sonnet copywriters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] hover:border-purple-500/40 transition group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition duration-300">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Webhook Listening</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connects directly to Meta webhooks. Detects likes, reviews existing profiles, and fires processing workflows asynchronously in under 5 seconds.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] hover:border-purple-500/40 transition group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ultra-Personalized AI Messages</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Claude 3.5 reads your goals, scans the liker's biography details, and creates individual, custom-drafted copy. No templates, no generic outreach.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] hover:border-purple-500/40 transition group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated A/B Learning Loop</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tracks clicks and conversions. Any message version with low click-through rates is automatically rewritten by AI optimization crons every 24 hours.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section - Modern Timeline */}
      <section id="how-it-works" className="w-full bg-[#0F1117] py-24 border-t border-[#2D3148]/60 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center md:text-left md:pl-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">How Threads Hunter works</h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl">
            Automate your conversion funnel from initial post reaction to email capture.
          </p>
        </div>

        <Timeline data={timelineData} />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#2D3148]/60">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Loved by creators and growth teams</h2>
          <p className="text-gray-400 mt-4">See how Threads Hunter helps builders capture and nurture leads on autopilot.</p>
        </div>
        <InfiniteMovingCardsDemo />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Find the plan that matches your audience size</h2>
          <p className="text-gray-400 mt-4">Simple monthly pricing. Upgrade, downgrade, or cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          {/* FREE PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Free</div>
              <div className="flex items-baseline text-white">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-gray-400 text-sm ml-1">/mo</span>
              </div>
              <p className="text-gray-400 text-xs mt-3">Great for trying out automation features.</p>
              
              <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                {PLANS.free.features.map((f, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={handleMetaLogin}
              className="mt-8 w-full bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white py-3 rounded-xl text-xs font-bold transition"
            >
              Sign Up Free
            </button>
          </motion.div>

          {/* STARTER PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest mb-2">Starter</div>
              <div className="flex items-baseline text-white">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="text-gray-400 text-sm ml-1">/mo</span>
              </div>
              <p className="text-gray-400 text-xs mt-3">Essential social integrations for growing accounts.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                {PLANS.starter.features.map((f, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/api/stripe/create-checkout?plan=starter"
              className="mt-8 w-full block text-center bg-[#7C3AED] hover:bg-purple-600 text-white py-3 rounded-xl text-xs font-bold transition"
            >
              Get Starter
            </Link>
          </motion.div>

          {/* PRO PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -10, scale: 1.01, transition: { duration: 0.2 } }}
            className="p-8 rounded-2xl bg-[#1A1D27] border-2 border-[#7C3AED] flex flex-col justify-between relative shadow-lg shadow-purple-950/20"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#7C3AED] text-white text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase shadow">
              Most Popular
            </div>
            <div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-2">Pro</div>
              <div className="flex items-baseline text-white">
                <span className="text-4xl font-extrabold">$59</span>
                <span className="text-gray-400 text-sm ml-1">/mo</span>
              </div>
              <p className="text-gray-400 text-xs mt-3">Complete tracking, analytics, and self-optimization loop.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                {PLANS.pro.features.map((f, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/api/stripe/create-checkout?plan=pro"
              className="mt-8 w-full block text-center bg-[#7C3AED] hover:bg-purple-600 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-purple-950/25"
            >
              Get Pro
            </Link>
          </motion.div>

          {/* SCALE PLAN */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-2xl bg-[#1A1D27] border border-[#2D3148] flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scale</div>
              <div className="flex items-baseline text-white">
                <span className="text-4xl font-extrabold">$99</span>
                <span className="text-gray-400 text-sm ml-1">/mo</span>
              </div>
              <p className="text-gray-400 text-xs mt-3">Unlimited actions, agency features, and team seats.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                {PLANS.scale.features.map((f, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/api/stripe/create-checkout?plan=scale"
              className="mt-8 w-full block text-center bg-[#202433] hover:bg-[#282d3f] border border-[#2D3148] text-white py-3 rounded-xl text-xs font-bold transition"
            >
              Get Scale
            </Link>
          </motion.div>
        </div>

      </section>

      {/* Tagline — Full-height section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden border-t border-[#2D3148]/60">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#7C3AED] opacity-[0.07] rounded-full blur-[160px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500 opacity-[0.05] rounded-full blur-[100px]" />
        </div>

        {/* Decorative top line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-[#7C3AED]/60" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#7C3AED]/60" />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        >
          <p className="text-purple-400/70 text-sm font-semibold tracking-[0.25em] uppercase mb-8">Our Mission</p>
          <h2 className="mx-auto text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05] mb-10">
            Capturing the heartbeat of{' '}
            <CanvasText
              text="your feed."
              backgroundClassName="bg-[#7C3AED]"
              colors={[
                'rgba(159,103,255,1)',
                'rgba(159,103,255,0.85)',
                'rgba(124,58,237,0.9)',
                'rgba(236,72,153,0.8)',
                'rgba(124,58,237,0.7)',
                'rgba(159,103,255,0.6)',
                'rgba(236,72,153,0.5)',
                'rgba(159,103,255,0.4)',
                'rgba(124,58,237,0.3)',
                'rgba(159,103,255,0.2)',
              ]}
              lineGap={6}
              animationDuration={15}
              curveIntensity={40}
            />
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every like, every comment, every follower is a signal. We turn those signals into conversations — and conversations into customers.
          </p>
        </motion.div>

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-t from-transparent to-[#7C3AED]/60" />
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#7C3AED]/60" />
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2D3148]/80 bg-[#131620] pt-16 pb-12 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 pb-12 border-b border-[#2D3148]/60">
          
          {/* Logo & Description Column */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center space-x-2">
              <Zap className="text-[#7C3AED] w-6 h-6" />
              <span className="text-lg font-black text-white tracking-tight">
                Threads<span className="text-[#7C3AED]">Hunter</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              The premier AI-driven social outreach platform. Monitor post reactions, write highly targeted personalized copy, and capture high-intent leads completely inside Next.js.
            </p>
            {/* Social Icons Mock */}
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A1D27] border border-[#2D3148] flex items-center justify-center hover:text-white hover:border-purple-500 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A1D27] border border-[#2D3148] flex items-center justify-center hover:text-white hover:border-purple-500 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A1D27] border border-[#2D3148] flex items-center justify-center hover:text-white hover:border-purple-500 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition font-medium">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition font-medium">Pricing Options</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition font-medium">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">Integration Guides</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition font-medium">Developer Docs</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">API Status</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">Meta Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">SaaS Templates</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition font-medium">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">Cookie Preferences</a></li>
              <li><a href="#" className="hover:text-white transition font-medium">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-4">
          <p>© 2026 Threads Hunter Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-400 transition font-medium">Terms</a>
            <a href="#" className="hover:text-gray-400 transition font-medium">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition font-medium">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
