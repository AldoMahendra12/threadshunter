"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full font-sans md:px-10"
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <TimelineItem key={index} item={item} index={index} />
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-[#202433] to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-[#9F67FF] via-[#7C3AED] to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({ item, index }: { item: TimelineEntry; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 50%", "end 30%"],
  });

  const backgroundColor = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], ["#131620", "#7C3AED", "#7C3AED", "#131620"]);
  const borderColor = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], ["#1A1D27", "#9F67FF", "#9F67FF", "#1A1D27"]);
  const boxShadow = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], ["none", "0 0 30px rgba(124,58,237,0.8)", "0 0 30px rgba(124,58,237,0.8)", "none"]);
  const textColor = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], ["rgba(255,255,255,0.15)", "rgba(255,255,255,1)", "rgba(255,255,255,1)", "rgba(255,255,255,0.15)"]);

  return (
    <div ref={ref} className="flex justify-start pt-10 md:pt-40 md:gap-10">
      <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
        <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#0F1117] flex items-center justify-center">
          <motion.div
            style={{ backgroundColor, borderColor, boxShadow }}
            className="h-4 w-4 rounded-full border p-2 transition-colors duration-200"
          />
        </div>
        <motion.h3 
          style={{ color: textColor }}
          className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold"
        >
          {item.title}
        </motion.h3>
      </div>

      <div className="relative pl-20 pr-4 md:pl-4 w-full">
        <motion.h3 
          style={{ color: textColor }}
          className="md:hidden block text-2xl mb-4 text-left font-bold"
        >
          {item.title}
        </motion.h3>
        {item.content}{" "}
      </div>
    </div>
  );
};
