"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Lightweight, dependency-free confetti burst — a one-shot celebration used on
 * lesson completion and certificate results. Pure framer-motion + CSS; no library.
 */
const COLORS = ["#58CC02", "#FFC800", "#1CB0F6", "#FF4B4B", "#CE82FF", "#FF9600"];

export default function Confetti({ count = 44, active = true }: { count?: number; active?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: 1.6 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 160,
        rotate: (Math.random() - 0.5) * 720,
        size: 6 + Math.random() * 6,
        rounded: Math.random() > 0.5,
      })),
    [count]
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
