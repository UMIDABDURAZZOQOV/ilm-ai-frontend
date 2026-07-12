"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Target, Clock, Zap } from "lucide-react";

import {
  getDashboard,
  startSession,
  setTargetScore,
  DashboardStats,
  ExamType,
  Difficulty,
  SessionStartResponse,
  SessionResult,
  FullTestCompleteResponse,
} from "@/lib/satIeltsApi";

import EmptyState from "./EmptyState";
import ScoreCard from "./ScoreCard";
import DomainAccuracyChart from "./DomainAccuracyChart";
import ScoreTrendChart from "./ScoreTrendChart";
import PracticeSession from "./PracticeSession";
import FullLengthTest from "./FullLengthTest";
import StudyPlanPanel from "./StudyPlanPanel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
}

interface SatIeltsDashboardProps {
  user: User & { is_premium?: boolean };
}

type MainTab = "overview" | "practice" | "full-test" | "study-plan";

// ── Session start form ────────────────────────────────────────────────────────

const SAT_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem Solving & Data Analysis",
  "Geometry & Trigonometry",
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
];

const IELTS_DOMAINS = ["Listening", "Reading", "Writing", "Speaking"];

interface SessionStartFormProps {
  examType: ExamType;
  onStart: (session: SessionStartResponse) => void;
  userId: number;
}

function SessionStartForm({ examType, onStart, userId }: SessionStartFormProps) {
  const domains = examType === "SAT" ? SAT_DOMAINS : IELTS_DOMAINS;
  const [domain, setDomain] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timed, setTimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startSession({
        user_id: userId,
        exam_type: examType,
        domain: domain || null,
        difficulty,
        num_questions: numQuestions,
        timed,
        duration_seconds: timed ? numQuestions * 90 : null,
      });
      onStart(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-3xl p-6 space-y-5 max-w-lg shadow-2xl shadow-blue-900/10 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-white text-lg">Start Practice Session</h4>
          <p className="text-xs text-slate-400">Master your skills with targeted practice</p>
        </div>
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          Domain <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <motion.select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          whileFocus={{ scale: 1.02 }}
          className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </motion.select>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          Difficulty
        </label>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <motion.button
              key={d}
              onClick={() => setDifficulty(d)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                difficulty === d
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50"
              }`}
            >
              {d}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Number of questions */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-400" />
            Questions
          </label>
          <motion.span 
            key={numQuestions}
            animate={{ scale: [1, 1.2, 1] }}
            className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full"
          >
            {numQuestions}
          </motion.span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          step={5}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
          {[5, 10, 15, 20, 25, 30].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>

      {/* Timed toggle */}
      <motion.div
        className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
          timed ? "bg-blue-500/10 border border-blue-500/30" : "bg-slate-800/50 border border-slate-700/50"
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <div>
          <p className="text-sm text-white font-medium">Timed Mode</p>
          <p className="text-xs text-slate-500">~90 seconds per question</p>
        </div>
        <motion.button
          onClick={() => setTimed((t) => !t)}
          whileTap={{ scale: 0.9 }}
          className={`relative h-7 w-13 rounded-full transition-all duration-300 ${
            timed ? "bg-blue-600" : "bg-slate-700"
          }`}
          style={{ width: "52px" }}
        >
          <motion.span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-300 ${
              timed ? "left-7" : "left-1"
            }`}
          />
        </motion.button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <motion.button
        onClick={handleStart}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Starting Session…
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" /> Start Session
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export default function SatIeltsDashboard({ user }: SatIeltsDashboardProps) {
  // This dashboard panel is now IELTS-focused — SAT has its own dedicated
  // platform at /sat, so we no longer expose the SAT/IELTS switcher here.
  const [examType] = useState<ExamType>("IELTS");
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);

  // Practice sub-state
  const [activeSession, setActiveSession] = useState<SessionStartResponse | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine premium status from user object
  const isPremium = !!(user as any).is_premium;

  // ── Dashboard fetch ────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const data = await getDashboard(user.id, examType);
      setDashboard(data);
      setDashError(null);
    } catch (err: any) {
      setDashError(err.message);
    } finally {
      setDashLoading(false);
    }
  }, [user.id, examType]);

  useEffect(() => {
    setDashLoading(true);
    setDashboard(null);
    fetchDashboard();

    // Refresh every 5 seconds
    intervalRef.current = setInterval(fetchDashboard, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDashboard]);

  // Reset session when switching exam types
  useEffect(() => {
    setActiveSession(null);
    setSessionResult(null);
  }, [examType]);

  // ── Target score handler ───────────────────────────────────────────────────
  const handleSetTarget = async (score: number) => {
    await setTargetScore(user.id, { target_score: score });
    fetchDashboard();
  };

  // ── Empty state shortcut ───────────────────────────────────────────────────
  const handleStartFromEmpty = () => {
    setActiveTab("practice");
  };

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs: { id: MainTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "practice", label: "Practice" },
    { id: "full-test", label: "Full Test" },
    { id: "study-plan", label: "Study Plan" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* IELTS header + pointer to the dedicated SAT platform */}
      <motion.div
        className="flex items-center justify-between gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25">
            IELTS
          </span>
          <span className="text-sm text-slate-400 hidden sm:inline">practice &amp; mock tests</span>
        </div>
        <Link
          href="/sat"
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Preparing for SAT? <span className="text-blue-400">Open SAT platform →</span>
        </Link>
      </motion.div>

      {/* Sub-tabs */}
      <motion.div 
        className="flex items-center gap-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-1.5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-slate-700 text-white shadow-md"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Loading state — only for overview tab */}
      {dashLoading && activeTab === "overview" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      )}

      {/* Error state — only show for overview, not practice */}
      {dashError && !dashLoading && activeTab === "overview" && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
          {dashError}
        </div>
      )}

      {/* Empty state — only for overview tab */}
      {!dashLoading && dashboard?.empty_state && activeTab === "overview" && (
        <EmptyState onStart={handleStartFromEmpty} />
      )}

      {/* Panel content */}
      {!dashLoading && (
        <AnimatePresence mode="wait">
          {/* ── Overview ── */}
          {activeTab === "overview" && !dashboard?.empty_state && (
            <motion.div
              key={`overview-${examType}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {dashboard && (
                <>
                  <ScoreCard
                    examType={examType}
                    predictedScore={dashboard.predicted_score}
                    targetScore={dashboard.target_score}
                    predictionAvailable={dashboard.predicted_score !== null}
                    message={
                      dashboard.predicted_score === null
                        ? "Complete at least 3 sessions to unlock score prediction."
                        : null
                    }
                    isPremium={isPremium}
                    history={dashboard.score_trend}
                    onSetTarget={handleSetTarget}
                  />

                  <DomainAccuracyChart
                    domainAccuracy={dashboard.domain_accuracy}
                    weakSpots={dashboard.weak_spots}
                    examType={examType}
                  />

                  <ScoreTrendChart
                    history={dashboard.score_trend}
                    examType={examType}
                    isPremium={isPremium}
                  />
                </>
              )}
            </motion.div>
          )}

          {/* ── Practice ── */}
          {activeTab === "practice" && (
            <motion.div
              key={`practice-${examType}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {!activeSession && !sessionResult && (
                <SessionStartForm
                  examType={examType}
                  userId={user.id}
                  onStart={(session) => {
                    setActiveSession(session);
                    setSessionResult(null);
                  }}
                />
              )}

              {activeSession && !sessionResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-300">
                      Active Session — {examType}
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSession(null);
                        setSessionResult(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  <PracticeSession
                    session={activeSession}
                    questions={activeSession.questions}
                    examType={examType}
                    onComplete={(result) => {
                      setSessionResult(result);
                      setActiveSession(null);
                      fetchDashboard();
                    }}
                  />
                </div>
              )}

              {sessionResult && (
                <div className="space-y-4">
                  {/* Summary banner */}
                  <div className="flex items-center justify-between bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-green-400">
                      Session Complete ✓ &mdash; {Math.round(sessionResult.score_pct)}% (
                      {sessionResult.questions_correct}/{sessionResult.questions_total})
                    </span>
                    <button
                      onClick={() => {
                        setSessionResult(null);
                        setActiveSession(null);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      + New Session
                    </button>
                  </div>

                  {/* Per-question review */}
                  <div className="space-y-3">
                    {sessionResult.per_question && sessionResult.per_question.map((pq, i) => (
                      <div
                        key={pq.question_id}
                        className={`rounded-xl border p-4 text-sm space-y-2 ${
                          pq.is_correct
                            ? "border-green-700/40 bg-green-900/10"
                            : "border-red-700/40 bg-red-900/10"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {pq.is_correct ? (
                            <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                          ) : (
                            <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                          )}
                          <p className="text-slate-200 font-medium">
                            Q{i + 1}. {pq.question_text}
                          </p>
                        </div>
                        <div className="pl-5 space-y-1 text-xs text-slate-400">
                          <p>
                            Your answer:{" "}
                            <span className={pq.is_correct ? "text-green-400" : "text-red-400"}>
                              {pq.user_answer ?? "(no answer)"}
                            </span>
                          </p>
                          {!pq.is_correct && pq.correct_answer && (
                            <p>
                              Correct:{" "}
                              <span className="text-green-400">{pq.correct_answer}</span>
                            </p>
                          )}
                          {pq.explanation && (
                            <p className="text-slate-500 italic">{pq.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Full Test ── */}
          {activeTab === "full-test" && (
            <motion.div
              key={`full-test-${examType}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <FullLengthTest
                user={user}
                examType={examType}
                isPremium={isPremium}
                onComplete={(result: FullTestCompleteResponse) => {
                  fetchDashboard();
                }}
              />
            </motion.div>
          )}

          {/* ── Study Plan ── */}
          {activeTab === "study-plan" && (
            <motion.div
              key={`study-plan-${examType}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <StudyPlanPanel
                userId={user.id}
                examType={examType}
                isPremium={isPremium}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
