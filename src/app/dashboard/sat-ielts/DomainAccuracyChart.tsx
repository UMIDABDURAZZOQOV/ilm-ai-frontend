"use client";

import { motion } from "framer-motion";
import { ExamType } from "@/lib/satIeltsApi";

interface DomainAccuracyChartProps {
  domainAccuracy: Record<string, number>;
  weakSpots: string[];
  examType: ExamType;
}

export default function DomainAccuracyChart({
  domainAccuracy,
  weakSpots,
  examType,
}: DomainAccuracyChartProps) {
  const entries = Object.entries(domainAccuracy);

  if (entries.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-2">Domain Accuracy</h3>
        <p className="text-slate-500 text-sm">
          Complete practice sessions to see domain accuracy.
        </p>
      </div>
    );
  }

  const THRESHOLD = 70; // 70%

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Domain Accuracy</h3>
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {examType}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          Strong (≥70%)
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          Weak (&lt;70%)
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {entries
          .sort(([, a], [, b]) => b - a)
          .map(([domain, accuracy]) => {
            const isWeak = weakSpots.includes(domain);
            const pct = Math.round(accuracy * 100);

            return (
              <div key={domain} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-medium truncate max-w-[60%] ${
                      isWeak ? "text-red-400" : "text-slate-300"
                    }`}
                  >
                    {domain}
                    {isWeak && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500/10 text-red-400 rounded-full">
                        weak
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-bold ${
                      isWeak ? "text-red-400" : "text-slate-300"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Bar track */}
                <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  {/* 70% reference marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-slate-600 z-10"
                    style={{ left: `${THRESHOLD}%` }}
                  />
                  {/* Value bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isWeak
                        ? "bg-gradient-to-r from-red-600 to-red-400"
                        : "bg-gradient-to-r from-blue-600 to-blue-400"
                    }`}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* 70% reference line label */}
      <p className="text-[11px] text-slate-600 flex items-center gap-1">
        <span className="w-4 h-px bg-slate-600 inline-block" />
        70% proficiency threshold
      </p>
    </motion.div>
  );
}
