"use client";

import { motion } from "framer-motion";

// A lightweight, dependency-free confetti burst: a ring of coloured pieces that
// fly outward and fade. Purely decorative, absolutely positioned over its parent
// (which must be `relative`). No canvas, no libraries.
const COLORS = ["#58CC02", "#FFC800", "#FF4B4B", "#8B5CF6", "#0EA5E9", "#F97316"];
const PIECES = 18;

export default function Celebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible flex items-center justify-center" aria-hidden>
      {Array.from({ length: PIECES }).map((_, i) => {
        const angle = (i / PIECES) * Math.PI * 2;
        const dist = 90 + (i % 4) * 22;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        return (
          <motion.span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y, scale: [0, 1.2, 1], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 220 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: (i % 5) * 0.02 }}
          />
        );
      })}
    </div>
  );
}
