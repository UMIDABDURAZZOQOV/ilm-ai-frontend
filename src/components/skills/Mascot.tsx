"use client";

import { motion } from "framer-motion";

export type MascotMood = "idle" | "happy" | "sad" | "cheer";

const MOOD_ROTATE: Record<MascotMood, number> = {
  idle: 0,
  happy: -6,
  sad: 4,
  cheer: 0,
};

/**
 * ILM AI's own friendly owl mascot -- fills the same encouraging-companion
 * role Duolingo's Duo plays (greets you, celebrates wins, looks sad when you
 * lose a heart), drawn from scratch as simple shapes rather than any
 * third-party asset.
 */
export default function Mascot({ mood = "idle", size = 96 }: { mood?: MascotMood; size?: number }) {
  const rotate = MOOD_ROTATE[mood];
  const eyesClosed = mood === "sad";
  const bounce = mood === "cheer";

  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={bounce ? { y: [0, -14, 0] } : { rotate: [rotate, rotate + 3, rotate] }}
      transition={bounce ? { duration: 0.6, repeat: Infinity } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <ellipse cx="50" cy="58" rx="38" ry="34" fill="#58CC02" />
        <ellipse cx="28" cy="30" rx="14" ry="16" fill="#58CC02" />
        <ellipse cx="72" cy="30" rx="14" ry="16" fill="#58CC02" />
        <circle cx="50" cy="50" r="30" fill="#8DE24C" />
        {eyesClosed ? (
          <>
            <path d="M32 48 Q38 54 44 48" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M56 48 Q62 54 68 48" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="38" cy="48" r="10" fill="white" />
            <circle cx="62" cy="48" r="10" fill="white" />
            <circle cx="39" cy="49" r="5" fill="#1a1a1a" />
            <circle cx="63" cy="49" r="5" fill="#1a1a1a" />
          </>
        )}
        <path d="M46 60 L50 68 L54 60 Z" fill="#FF9600" />
        {mood === "happy" || mood === "cheer" ? (
          <path d="M38 70 Q50 82 62 70" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === "sad" ? (
          <path d="M38 76 Q50 68 62 76" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M40 72 Q50 78 60 72" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
