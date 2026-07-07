"use client";

import { useState } from "react";
import { Target, TrendingUp, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ExamType, ScorePredictionPoint } from "@/lib/satIeltsApi";

interface ScoreCardProps {
  examType: ExamType;
  predictedScore: number | null;
  targetScore: number | null;
  predictionAvailable: boolean;
  message: string | null;
  isPremium: boolean;
  history: ScorePredictionPoint[];
  onSetTarget: (score: number) => Promise<void>;
}

export default function ScoreCard({
  examType,
  predictedScore,
  targetScore,
  predictionAvailable,
  message,
  isPremium,
  history,
  onSetTarget,
}: ScoreCardProps) {
  const [inputScore, setInputScore] = useState(
    targetScore?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSAT = examType === "SAT";
  const gap =
    predictionAvailable && predictedScore !== null && targetScore !== null
      ? targetScore - predictedScore
      : null;

  const handleSave = async () => {
    const val = parseFloat(inputScore);
    if (isNaN(val)) return;
    setSaving(true);
    try {
      await onSetTarget(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Format score for display
  const displayScore = predictionAvailable && predictedScore !== null
    ? isSAT
      ? Math.round(predictedScore).toString()
      : predictedScore.toFixed(1)
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">Score Prediction</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 uppercase tracking-wider">
          {examType}
        </span>
      </div>

      {/* Big Score */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-slate-500 text-xs mb-1">Predicted Score</p>
          <p className="text-5xl font-black text-white leading-none">
            {displayScore}
          </p>
          {isSAT ? (
            <p className="text-slate-500 text-xs mt-1">out of 1600</p>
          ) : (
            <p className="text-slate-500 text-xs mt-1">band score (1–9)</p>
          )}
        </div>

        {/* Target gap pill */}
        {gap !== null && (
          <div
            className={`ml-auto px-3 py-1.5 rounded-full text-sm font-semibold ${
              gap > 0
                ? "bg-orange-500/10 text-orange-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {gap > 0 ? `+${isSAT ? Math.round(gap) : gap.toFixed(1)} to target` : "Target reached 🎉"}
          </div>
        )}
      </div>

      {/* Not available message */}
      {!predictionAvailable && message && (
        <div className="bg-slate-800/60 rounded-xl p-4 text-slate-400 text-sm border border-slate-700">
          {message}
        </div>
      )}

      {/* Mini history (premium) */}
      {isPremium && history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Recent History
          </p>
          <div className="flex items-end gap-1.5 h-12">
            {history.slice(-8).map((pt, i) => {
              const maxScore = isSAT ? 1600 : 9;
              const minScore = isSAT ? 400 : 1;
              const pct =
                ((pt.predicted_score - minScore) / (maxScore - minScore)) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div
                    className="w-full bg-blue-500/60 rounded-t-sm transition-all group-hover:bg-blue-400"
                    style={{ height: `${Math.max(pct, 6)}%` }}
                    title={`${isSAT ? Math.round(pt.predicted_score) : pt.predicted_score.toFixed(1)} — ${new Date(pt.computed_at).toLocaleDateString()}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free-tier upgrade hint */}
      {!isPremium && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Upgrade to Premium to see your full score history and trend.</span>
        </div>
      )}

      {/* Target score form */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" /> Target Score
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={inputScore}
            onChange={(e) => setInputScore(e.target.value)}
            placeholder={isSAT ? "e.g. 1400" : "e.g. 7.5"}
            min={isSAT ? 400 : 1}
            max={isSAT ? 1600 : 9}
            step={isSAT ? 10 : 0.5}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600"
          />
          <button
            onClick={handleSave}
            disabled={saving || !inputScore}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {saving ? "…" : saved ? "Saved ✓" : "Set"}
          </button>
        </div>
        {targetScore !== null && (
          <p className="text-xs text-slate-500">
            Current target:{" "}
            <span className="text-blue-400 font-semibold">
              {isSAT ? Math.round(targetScore) : targetScore.toFixed(1)}
            </span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
