'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin } from 'lucide-react'

export interface CardItem {
  id: number
  step: string
  title: string
  content: string
  icon?: React.ReactNode
}

interface CardStackProps {
  items: CardItem[]
  activeIndex?: number
}

export const CardStack = ({ items, activeIndex }: CardStackProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // Which card is shown on top — driven by scroll (activeIndex) unless hovered (pinned)
  const [pinnedIndex, setPinnedIndex] = useState<number>(items[0]?.id ?? 1)

  // When hovered, freeze. When unhovered, sync back to scroll position.
  useEffect(() => {
    if (!isHovered && activeIndex !== undefined) {
      setPinnedIndex(activeIndex)
    }
  }, [activeIndex, isHovered])

  const topId = isHovered ? pinnedIndex : (activeIndex ?? pinnedIndex)

  // Reorder so topId is first
  const topIdx = items.findIndex(i => i.id === topId)
  const ordered =
    topIdx === -1
      ? items
      : [...items.slice(topIdx), ...items.slice(0, topIdx)]

  // Only render the top 3 so the stack doesn't get too deep
  const visible = ordered.slice(0, 3)

  const OFFSET_Y = 14   // px each back-card is lower than the one in front
  const SCALE_STEP = 0.06 // each back-card shrinks by this factor

  return (
    <div
      onMouseEnter={() => {
        setPinnedIndex(activeIndex ?? items[0].id)
        setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
      // Extra bottom padding so the back-cards (which shift downward) aren't clipped
      className="relative w-full max-w-md select-none"
      style={{ height: `calc(220px + ${(visible.length - 1) * OFFSET_Y}px)` }}
    >
      {visible.map((card, index) => {
        const isTop = index === 0
        return (
          <motion.div
            key={card.id}
            className={`absolute left-0 right-0 rounded-2xl p-6 flex flex-col justify-between
              bg-[#1A1D27] border shadow-xl
              ${isTop && isHovered
                ? 'border-[#7C3AED] shadow-[0_0_32px_rgba(124,58,237,0.30)]'
                : 'border-[#2D3148]/80'
              }`}
            style={{ height: '220px' }}
            animate={{
              // back-cards shift DOWN so they peek below the top card
              top: index * OFFSET_Y,
              scale: 1 - index * SCALE_STEP,
              zIndex: visible.length - index,
              opacity: isTop ? 1 : 1 - index * 0.25,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            {/* Pinned badge — appears on hover for the top card */}
            <AnimatePresence>
              {isTop && isHovered && (
                <motion.div
                  key="pin-badge"
                  initial={{ opacity: 0, scale: 0.7, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: -4 }}
                  className="absolute top-3.5 right-3.5 bg-[#7C3AED]/20 border border-[#7C3AED]/40
                    text-[#9F67FF] px-2 py-0.5 rounded-full flex items-center space-x-1
                    text-[9px] font-mono font-bold tracking-wider uppercase"
                >
                  <Pin className="w-2.5 h-2.5" />
                  <span>Pinned</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card content */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30
                  flex items-center justify-center text-[#9F67FF] font-black text-sm">
                  {card.step}
                </div>
                <h4 className={`text-sm font-extrabold text-white leading-tight ${isTop ? 'pr-14' : ''}`}>
                  {card.title}
                </h4>
              </div>
              {isTop && (
                <p className="text-xs leading-relaxed text-gray-400 font-medium">
                  {card.content}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-gray-500 uppercase font-mono mt-auto pt-3">
              <span>System outreach step</span>
              <span>{card.step} of 4</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
