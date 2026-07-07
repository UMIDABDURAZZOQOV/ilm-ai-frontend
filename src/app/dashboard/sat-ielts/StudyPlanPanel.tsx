"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, BookOpen, Lock } from "lucide-react";
import { generateStudyPlan, ExamType, StudyPlanResponse, StudyPlanWeek } from "@/lib/satIeltsApi";

interface StudyPlanPanelProps {
  userId: number;
  examType: ExamType;
  isPremium: boolean;
}

export default function StudyPlanPanel({
  userId,
  examType,
  isPremium,
}: StudyPlanPanelProps) {
  const [targetDate, setTargetDate] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSAT = examType === "SAT";

  const handleGenerate = async () => {
    if (!targetDate || !targetScore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateStudyPlan({
        user_id: userId,
        exam_type: examType,
        target_date: targetDate,
        target_score: parseFloat(targetScore),
        daily_hours: dailyHours,
      });
      setPlan(res);
    } catch (err: any) {
      // HTTP 400: user hasn't completed a session yet
      const msg: string = err.message ?? "";
      if (msg.includes("400") || msg.toLowerCase().includes("session")) {
        setError("Complete at least one practice session first.");
      } else {
        setError(msg || "Failed to generate plan. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Generate Study Plan</h3>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 uppercase tracking-wider">
            {examType}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Target date */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Target Exam Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Target score */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">
              Target {isSAT ? "Score (400–1600)" : "Band (1–9)"}
            </label>
            <input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder={isSAT ? "e.g. 1400" : "e.g. 7.5"}
              min={isSAT ? 400 : 1}
              max={isSAT ? 1600 : 9}
              step={isSAT ? 10 : 0.5}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Daily hours slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">
              Daily Study Hours
            </label>
            <span className="text-sm font-bold text-blue-400">{dailyHours}h</span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>1h</span>
            <span>2h</span>
            <span>3h</span>
            <span>4h</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !targetDate || !targetScore}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" /> Generate Plan
            </>
          )}
        </button>
      </motion.div>

      {/* Plan output */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Your {plan.weeks.length}-Week Plan
            </h4>

            {plan.weeks.map((week: StudyPlanWeek) => (
              <div
                key={week.week}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">
                    Week {week.week}: {week.focus}
                  </span>
                  <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-full">
                    {week.hours}h / day
                  </span>
                </div>

                {week.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {week.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {week.tasks.length > 0 && (
                  <ul className="space-y-1">
                    {week.tasks.map((task, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
