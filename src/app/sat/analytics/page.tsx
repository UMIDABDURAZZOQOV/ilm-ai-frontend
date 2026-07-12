"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, BarChart3, Target, TrendingUp, History, Check, Flame, Droplets, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboard,
  getScorePrediction,
  getUserSessions,
  setTargetScore,
  type DashboardStats,
  type ScorePrediction,
  type UserSession,
} from "@/lib/satIeltsApi";

function TrendChart({ points }: { points: { predicted_score: number }[] }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.predicted_score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}

export default function SatAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prediction, setPrediction] = useState<ScorePrediction | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [d, p, s] = await Promise.allSettled([
      getDashboard(user.id, "SAT"),
      getScorePrediction(user.id, "SAT"),
      getUserSessions(user.id, "SAT"),
    ]);
    if (d.status === "fulfilled") setStats(d.value);
    if (p.status === "fulfilled") setPrediction(p.value);
    if (s.status === "fulfilled") setSessions(s.value.sessions || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveTarget() {
    const target = parseInt(targetInput, 10);
    if (!user || !target || target < 400 || target > 1600) return;
    setSavingTarget(true);
    try {
      await setTargetScore(user.id, { target_score: target });
      setTargetSaved(true);
      setTargetInput("");
      await load();
      setTimeout(() => setTargetSaved(false), 2500);
    } catch {
      // keep the form usable; the value simply didn't save
    } finally {
      setSavingTarget(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completed = sessions.filter((s) => s.status === "completed");
  const domains = Object.entries(stats?.domain_accuracy ?? {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Analytics</h1>
        <p className="text-slate-500 mt-1">Track your progress and identify weak spots</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Questions attempted</div>
          <div className="text-3xl font-bold">{stats?.questions_attempted ?? 0}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Current accuracy</div>
          <div className="text-3xl font-bold">{stats?.overall_accuracy ? Math.round(stats.overall_accuracy) : 0}%</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Saved questions</div>
          <div className="text-3xl font-bold">0</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Study streak</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            {stats?.sessions_completed ?? 0}
          </div>
        </motion.div>
      </div>

      {/* Recent session scores (real data) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
      >
        <h3 className="font-bold mb-4">Recent session scores</h3>
        {(() => {
          const scored = completed.filter((s) => s.score_pct != null).slice(-14);
          if (scored.length === 0) {
            return <p className="text-sm text-slate-500">Complete practice sessions to see your scores here.</p>;
          }
          return (
            <>
              <div className="flex gap-1.5 items-end h-24">
                {scored.map((s) => {
                  const pct = Math.max(4, Math.min(100, s.score_pct as number));
                  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={s.id} className="flex-1 flex flex-col justify-end" title={`${Math.round(s.score_pct as number)}%`}>
                      <div className={`w-full rounded-t-sm ${color} transition-all hover:opacity-80`} style={{ height: `${pct}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Oldest</span>
                <span>Latest</span>
              </div>
            </>
          );
        })()}
      </motion.div>

      {/* Prediction + Target */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Predicted score</div>
          {prediction?.prediction_available && prediction.predicted_score != null ? (
            <>
              <p className="text-5xl font-black">{Math.round(prediction.predicted_score)}</p>
              {stats && stats.score_trend.length >= 2 && <TrendChart points={stats.score_trend} />}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Take the diagnostic to see your predicted score
              </p>
              <Link
                href="/sat/bank"
                className="inline-block bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg"
              >
                Start diagnostic
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="text-sm font-bold text-slate-500 mb-2">Target score</div>
          <p className="text-5xl font-black mb-1">{stats?.target_score ?? "—"}</p>
          {stats?.target_gap != null && (
            <p className="text-xs text-slate-400 mb-3">
              {Math.abs(Math.round(stats.target_gap))} points to go
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min={400}
              max={1600}
              step={10}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. 1400"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:border-primary"
            />
            <button
              onClick={handleSaveTarget}
              disabled={savingTarget || !targetInput}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all"
            >
              {savingTarget ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : targetSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                "Set"
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Domain accuracy */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
      >
        <h3 className="font-bold mb-4">Accuracy by topic</h3>
        {domains.length === 0 ? (
          <p className="text-sm text-slate-500">
            No data yet —{" "}
            <Link href="/sat/bank" className="text-blue-500 font-bold hover:underline">
              start practicing
            </Link>{" "}
            to see your accuracy per domain.
          </p>
        ) : (
          <div className="space-y-3">
            {domains.map(([domain, acc]) => (
              <div key={domain} className="flex items-center gap-3 sm:gap-4">
                <span className="text-sm flex-1 min-w-0 truncate">{domain}</span>
                <div className="w-20 sm:w-44 shrink-0 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      acc >= 70 ? "bg-emerald-500" : acc >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, acc)}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-11 text-right tabular-nums shrink-0">{Math.round(acc)}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Session history */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Recent sessions</h3>
          <Link href="/sat/bank" className="text-sm font-bold text-blue-500 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {completed.length === 0 ? (
          <p className="text-sm text-slate-500">No completed sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {completed.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.domain || (s.session_type === "full_test" ? "Full-length test" : "Mixed practice")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {s.session_type === "full_test" ? "Mock test" : "Practice"} ·{" "}
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ""}
                  </p>
                </div>
                {s.score_pct != null && (
                  <span
                    className={`text-sm font-black tabular-nums ${
                      s.score_pct >= 70
                        ? "text-emerald-500"
                        : s.score_pct >= 40
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {Math.round(s.score_pct)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
