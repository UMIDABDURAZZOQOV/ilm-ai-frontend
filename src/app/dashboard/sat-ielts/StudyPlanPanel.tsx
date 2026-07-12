"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, BookOpen, Lock, Calendar, Clock, Target, ChevronRight, ArrowRight } from "lucide-react";
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
      {!plan ? (
        <>
          <div>
            <h1 className="text-3xl font-bold">📅 Study Planner</h1>
            <p className="text-slate-500 mt-1">Create a personalized study plan to reach your target score</p>
          </div>

          {/* How it works */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <div className="font-bold">Set your target</div>
                  <div className="text-sm text-slate-500">Enter your target score and exam date</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <div className="font-bold">AI generates your plan</div>
                  <div className="text-sm text-slate-500">Based on your current performance and available time</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <div className="font-bold">Follow daily tasks</div>
                  <div className="text-sm text-slate-500">Complete daily practice to stay on track</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Target Exam Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Target {isSAT ? "Score (400–1600)" : "Band (1–9)"}
                </label>
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder={isSAT ? "e.g. 1400" : "e.g. 7.5"}
                  min={isSAT ? 400 : 1}
                  max={isSAT ? 1600 : 9}
                  step={isSAT ? 10 : 0.5}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Daily Study Hours
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-lg font-bold text-blue-500 w-12 text-right">{dailyHours}h</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>1h</span>
                <span>2h</span>
                <span>3h</span>
                <span>4h</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !targetDate || !targetScore}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  Generate my study plan <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlan(null)}
              className="text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              ‹ Back to planner
            </button>
            <h1 className="text-3xl font-bold flex-1">Your Study Plan</h1>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-500">Duration</div>
                <div className="text-2xl font-bold">{plan.weeks.length} weeks</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Daily hours</div>
                <div className="text-2xl font-bold">{dailyHours}h</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Target score</div>
                <div className="text-2xl font-bold">{targetScore}</div>
              </div>
            </div>
          </div>

          {/* Weekly plan */}
          <div className="space-y-4">
            {plan.weeks.map((week: StudyPlanWeek) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: week.week * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-bold">Week {week.week}</div>
                    <div className="text-sm text-slate-500">{week.focus}</div>
                  </div>
                  <span className="text-sm font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    {week.hours}h/day
                  </span>
                </div>

                {week.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {week.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {week.tasks.length > 0 && (
                  <div className="space-y-2">
                    {week.tasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
