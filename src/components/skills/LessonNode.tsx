"use client";

import { motion } from "framer-motion";
import { Check, Lock, Star } from "lucide-react";
import type { SkillTreeLesson } from "@/lib/skillTreeApi";

export default function LessonNode({
  lesson,
  title,
  color,
  onClick,
}: {
  lesson: SkillTreeLesson;
  title: string;
  color: string;
  onClick: () => void;
}) {
  const locked = lesson.status === "locked";
  const completed = lesson.status === "completed";
  const current = lesson.status === "unlocked";

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={locked ? {} : { scale: 1.06 }}
        whileTap={locked ? {} : { scale: 0.94 }}
        animate={current ? { boxShadow: ["0 0 0 0 rgba(88,204,2,0.35)", "0 0 0 10px rgba(88,204,2,0)"] } : {}}
        transition={current ? { duration: 1.6, repeat: Infinity } : {}}
        onClick={onClick}
        disabled={locked}
        title={title}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 ${
          locked
            ? "bg-neutral-200 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 cursor-not-allowed"
            : completed
            ? "border-b-8"
            : "border-b-8"
        }`}
        style={
          locked
            ? {}
            : {
                backgroundColor: completed ? color : "#fff",
                borderColor: color,
              }
        }
      >
        {locked ? (
          <Lock className="w-6 h-6 text-neutral-400" />
        ) : completed ? (
          <Check className="w-7 h-7 text-white" strokeWidth={3} />
        ) : (
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
        )}
      </motion.button>
      {completed && lesson.stars > 0 && (
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i <= lesson.stars ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
