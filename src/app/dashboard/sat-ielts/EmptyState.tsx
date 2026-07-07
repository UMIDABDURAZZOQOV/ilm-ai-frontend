"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface EmptyStateProps {
  onStart: () => void;
}

export default function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center"
    >
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 max-w-md w-full shadow-xl">
        <div className="h-20 w-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="h-10 w-10 text-blue-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Start Your SAT/IELTS Journey
        </h2>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Complete your first practice session to unlock personalised score
          predictions, domain accuracy charts, and a tailored study plan.
        </p>

        <button
          onClick={onStart}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
        >
          Start Practice
        </button>
      </div>
    </motion.div>
  );
}
