"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function InfiniteMovingCardsDemo() {
  return (
    <div className="w-full rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden py-10 gap-2">
      {/* First row of moving cards (scrolling right) */}
      <InfiniteMovingCards
        items={testimonialsRow1}
        direction="right"
        speed="slow"
      />
      {/* Second row of moving cards (scrolling left) */}
      <InfiniteMovingCards
        items={testimonialsRow2}
        direction="left"
        speed="slow"
      />
    </div>
  );
}

const testimonialsRow1 = [
  {
    quote:
      "Threads Hunter doubled our conversion rate in 3 days. The automated comments drafted by Claude feel incredibly authentic and match our brand voice perfectly.",
    name: "Sarah Jenkins",
    title: "Founder, CreatorLoop",
  },
  {
    quote:
      "The Stripe integration and A/B test logs allowed us to optimize outreach instantly. We captured over 400 new leads from a single trending post.",
    name: "Alex Rivera",
    title: "Growth Lead, Saasify",
  },
  {
    quote:
      "Setup was painless. Connect Meta, paste your post URL, set a CTA, and let it run. It's like having a dedicated copywriter working 24/7.",
    name: "Marcus Vance",
    title: "Indie Hacker",
  },
];

const testimonialsRow2 = [
  {
    quote:
      "The dynamic bio personalization is the killer feature. Instead of spammy comments, users receive highly contextual responses that lead to real DM conversations.",
    name: "Jessica Chen",
    title: "Social Architect, Bloom Media",
  },
  {
    quote:
      "Stripe checkout portal and daily analytics gave us exactly what we needed to scale our client campaigns. Highly recommend to any creator agency.",
    name: "David K.",
    title: "Director of Marketing, Nexa",
  },
  {
    quote:
      "The cron-driven automated rewrite feature is brilliant. Watching click-through rates climb day-by-day while sleep-monitoring posts is a total game changer.",
    name: "Elena Rostova",
    title: "Product Marketing, ScaleFlow",
  },
];
