"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { ExamType, ScorePredictionPoint } from "@/lib/satIeltsApi";

interface ScoreTrendChartProps {
  history: ScorePredictionPoint[];
  examType: ExamType;
  isPremium: boolean;
}

export default function ScoreTrendChart({
  history,
  examType,
  isPremium,
}: ScoreTrendChartProps) {
  const isSAT = examType === "SAT";
  const minScore = isSAT ? 400 : 1;
  const maxScore = isSAT ? 1600 : 9;

  // Free tier: show only the latest point
  const visibleHistory = isPremium ? history : history.slice(-1);

  const isEmpty = visibleHistory.length === 0;

  const normalize = (score: number) =>
    ((score - minScore) / (maxScore - minScore)) * 100;

  const formatScore = (score: number) =>
    isSAT ? Math.round(score).toString() : score.toFixed(1);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Score Trend</h3>
        {!isPremium && (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 rounded-full px-2 py-0.5">
            <Lock className="h-3 w-3" /> Premium
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-slate-500 text-sm py-6 text-center">
          No score history yet. Complete more sessions to see your trend.
        </p>
      ) : (
        <>
          {/* Simple dot-and-line chart using CSS */}
          <div className="relative h-28 select-none">
            {/* Y-axis ghost lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-slate-800"
                style={{ bottom: `${pct}%` }}
              />
            ))}

            {/* SVG for connecting lines + dots */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {visibleHistory.length > 1 &&
                visibleHistory.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = visibleHistory[i - 1];
                  const totalPts = visibleHistory.length;
                  const x1 = ((i - 1) / (totalPts - 1)) * 100;
                  const x2 = (i / (totalPts - 1)) * 100;
                  const y1 = 100 - normalize(prev.predicted_score);
                  const y2 = 100 - normalize(pt.predicted_score);
                  return (
                    <line
                      key={i}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
            </svg>

            {/* Dots + labels */}
            {visibleHistory.map((pt, i) => {
              const totalPts = visibleHistory.length;
              const leftPct =
                totalPts === 1 ? 50 : (i / (totalPts - 1)) * 100;
              const bottomPct = normalize(pt.predicted_score);

              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2"
                  style={{
                    left: `${leftPct}%`,
                    bottom: `${bottomPct}%`,
                    transform: `translateX(-50%) translateY(50%)`,
                  }}
                >
                  <span className="text-[10px] text-blue-300 font-bold -mt-5 whitespace-nowrap">
                    {formatScore(pt.predicted_score)}
                  </span>
                  <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-slate-900 shadow-lg" />
                </div>
              );
            })}
          </div>

          {/* X-axis dates */}
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            {visibleHistory.map((pt, i) => (
              <span key={i}>{formatDate(pt.computed_at)}</span>
            ))}
          </div>
        </>
      )}

      {/* Free tier upsell */}
      {!isPremium && history.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>
            Upgrade to Premium to see your full score trend across{" "}
            {history.length} data points.
          </span>
        </div>
      )}
    </motion.div>
  );
}
