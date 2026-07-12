"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, ChevronRight, Grid3x3, Bookmark, RotateCcw, Clock } from "lucide-react";
import {
  startFullTest,
  completeSectionTest,
  completeFullTest,
  completeSession,
  submitAnswer,
  ExamType,
  Question,
  FullTestResponse,
  SATFullTestResponse,
  IELTSFullTestResponse,
  FullTestCompleteResponse,
  SessionResult,
} from "@/lib/satIeltsApi";
import AiAnalysisPanel from "./AiAnalysisPanel";

interface User {
  id: number;
  name: string;
  email: string;
}

interface FullLengthTestProps {
  user: User;
  examType: ExamType;
  isPremium: boolean;
  onComplete: (result: SessionResult) => void;
}

type TestPhase = "idle" | "active" | "section_done" | "done";

export default function FullLengthTest({
  user,
  examType,
  isPremium,
  onComplete,
}: FullLengthTestProps) {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [testData, setTestData] = useState<FullTestResponse | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, string>>({});
  const [flaggedMap, setFlaggedMap] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);

  // ── Premium gate ───────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6 py-12 space-y-4">
        <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Premium Feature</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Full-length {examType} simulations are available on the Premium plan.
          Upgrade to access timed exams, section management, and detailed
          analysis.
        </p>
        <button
          onClick={() => window.location.assign("/dashboard?panel=subscription")}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-sm transition-all"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleStartTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startFullTest({ user_id: user.id, exam_type: examType });
      setTestData(data);
      
      // Handle SAT modular format
      if (data.test_type === "sat_modular") {
        const satData = data as SATFullTestResponse;
        const firstModule = satData.modules[0];
        setCurrentSessionId(firstModule.session_id);
        setTimeLeft(firstModule.duration_seconds);
        setCurrentSectionIdx(0);
        setCurrentQIdx(0);
        setAnsweredMap({});
        setSelectedAnswer("");
        setPhase("active");
        // Fetch questions for first module
        // Note: We'll need to fetch questions from the session endpoint
        setCurrentQuestions([]); // Will be populated by fetching
      }
      // Handle IELTS sectional format
      else if (data.test_type === "ielts_sectional") {
        const ieltsData = data as IELTSFullTestResponse;
        const firstSection = ieltsData.sections[0];
        setCurrentSessionId(firstSection.session_id);
        setTimeLeft(firstSection.duration_seconds);
        setCurrentSectionIdx(0);
        setCurrentQIdx(0);
        setAnsweredMap({});
        setSelectedAnswer("");
        setPhase("active");
        setCurrentQuestions([]); // Will be populated by fetching
      }
      // Handle old format (fallback)
      else {
        const oldData = data as any;
        setCurrentSessionId(oldData.test_id);
        setCurrentQuestions(oldData.questions);
        setCurrentSectionIdx(0);
        setCurrentQIdx(0);
        setAnsweredMap({});
        setSelectedAnswer("");
        setTimeLeft(oldData.section_duration_seconds);
        setPhase("active");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentSessionId || !selectedAnswer || submitting) return;
    const q = currentQuestions[currentQIdx];
    if (!q || answeredMap[q.id] !== undefined) return;
    setSubmitting(true);
    try {
      await submitAnswer(currentSessionId, {
        question_id: q.id,
        answer: selectedAnswer,
        elapsed_ms: 0,
      });
      setAnsweredMap((prev) => ({ ...prev, [q.id]: selectedAnswer }));
      setSelectedAnswer("");
      if (currentQIdx < currentQuestions.length - 1) {
        setCurrentQIdx((i) => i + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSection = async () => {
    if (!currentSessionId) return;
    setLoading(true);
    try {
      // Complete current session
      const result = await completeSession(currentSessionId);
      
      // For SAT/IELTS modular/sectional tests, advance to next section
      if (testData && (testData.test_type === "sat_modular" || testData.test_type === "ielts_sectional")) {
        const sections = (testData as any).modules || (testData as any).sections;
        if (currentSectionIdx < sections.length - 1) {
          const nextSection = sections[currentSectionIdx + 1];
          setCurrentSessionId(nextSection.session_id);
          setTimeLeft(nextSection.duration_seconds);
          setCurrentSectionIdx((i) => i + 1);
          setCurrentQIdx(0);
          setAnsweredMap({});
          setSelectedAnswer("");
          setCurrentQuestions([]); // Will need to fetch
          setPhase("active");
        } else {
          // All sections complete
          setResult(result);
          setPhase("done");
          onComplete(result);
        }
      } else {
        // Old format or single session
        setResult(result);
        setPhase("done");
        onComplete(result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSectionName = () => {
    if (!testData) return "";
    if (testData.test_type === "sat_modular") {
      const modules = (testData as SATFullTestResponse).modules;
      const current = modules[currentSectionIdx];
      return current ? `Module ${current.module} - ${current.section}` : "";
    }
    if (testData.test_type === "ielts_sectional") {
      const sections = (testData as IELTSFullTestResponse).sections;
      const current = sections[currentSectionIdx];
      return current ? current.section : "";
    }
    // Old format
    const sections = (testData as any).sections;
    return sections ? sections[currentSectionIdx] : "";
  };

  const getTotalSections = () => {
    if (!testData) return 0;
    if (testData.test_type === "sat_modular") {
      return (testData as SATFullTestResponse).modules.length;
    }
    if (testData.test_type === "ielts_sectional") {
      return (testData as IELTSFullTestResponse).sections.length;
    }
    return (testData as any).sections?.length || 0;
  };

  const currentSection = getCurrentSectionName();
  const totalSections = getTotalSections();
  const currentQ = currentQuestions[currentQIdx];
  const isQAnswered = currentQ ? answeredMap[currentQ.id] !== undefined : false;
  const allAnswered = currentQuestions.every((q) => answeredMap[q.id] !== undefined);

  const handlePrevious = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx((i) => i - 1);
      setSelectedAnswer("");
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentQIdx(idx);
    setSelectedAnswer("");
    setShowQuestionGrid(false);
  };

  const toggleFlag = () => {
    if (currentQ) {
      setFlaggedMap((prev) => ({
        ...prev,
        [currentQ.id]: !prev[currentQ.id],
      }));
    }
  };

  const getQuestionStatus = (qId: number) => {
    const answered = answeredMap[qId] !== undefined;
    const flagged = flaggedMap[qId];
    if (answered) return "answered";
    if (flagged) return "flagged";
    return "unanswered";
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "done" && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-slate-400 mb-2">Full Test Complete</p>
          <p className="text-5xl font-black text-white mb-1">
            {Math.round(result.score_pct)}%
          </p>
          <p className="text-slate-400 text-sm">
            {result.questions_correct} / {result.questions_total} correct
          </p>
        </div>

        {(result as any).section_scores && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-300">Section Breakdown</h4>
            {Object.entries((result as any).section_scores).map(([section, pct]) => (
              <div key={section} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{section}</span>
                <span className="text-white font-bold">{Math.round(Number(pct))}%</span>
              </div>
            ))}
          </div>
        )}

        {/* AI mistake analysis */}
        <AiAnalysisPanel sessionId={result.session_id} />
      </motion.div>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6 py-12 space-y-4">
        <h3 className="text-xl font-bold text-white">
          Full-Length {examType} Test
        </h3>
        <p className="text-slate-400 text-sm max-w-sm">
          Simulate a real exam experience with timed sections and full question
          coverage. Results count toward your score prediction.
        </p>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        <button
          onClick={handleStartTest}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            `Start ${examType} Full Test`
          )}
        </button>
      </div>
    );
  }

  // ── Active section ─────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div className="space-y-4">
      {/* Section progress */}
      <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
        <span className="text-sm font-semibold text-white">
          Section {currentSectionIdx + 1} of {totalSections}:{" "}
          <span className="text-blue-400">{currentSection}</span>
        </span>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <span
              className={`text-sm font-bold flex items-center gap-1.5 ${
                timeLeft < 60 ? "text-red-400" : "text-slate-300"
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </span>
          )}
          <button
            onClick={() => setShowQuestionGrid(!showQuestionGrid)}
            className={`p-2 rounded-lg transition-all ${
              showQuestionGrid
                ? "bg-blue-500/10 text-blue-400"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Q {currentQIdx + 1} / {currentQuestions.length}</span>
          <span>{Object.keys(answeredMap).length} answered</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{
              width: `${((currentQIdx + 1) / currentQuestions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
        <p className="text-white font-medium leading-relaxed">
          {currentQ.question_text}
        </p>

        {/* MCQ */}
        {currentQ.question_type === "mcq" && currentQ.options && (
          <div className="space-y-2">
            {currentQ.options.map((opt, oi) => {
              const submitted = answeredMap[currentQ.id];
              const isSelected = selectedAnswer === opt || submitted === opt;
              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setSelectedAnswer(opt)}
                  disabled={!!submitted}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    submitted
                      ? submitted === opt
                        ? "border-blue-500 bg-blue-500/10 text-blue-300 cursor-default"
                        : "border-slate-700 bg-slate-800/40 text-slate-500 cursor-default"
                      : isSelected
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <span className="font-bold mr-2 text-slate-500">
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Short answer */}
        {currentQ.question_type === "short_answer" && (
          <input
            type="text"
            value={isQAnswered ? (answeredMap[currentQ.id] ?? "") : selectedAnswer}
            onChange={(e) => !isQAnswered && setSelectedAnswer(e.target.value)}
            disabled={isQAnswered}
            placeholder="Type your answer…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
          />
        )}

        {/* Essay */}
        {currentQ.question_type === "essay" && (
          <textarea
            value={isQAnswered ? (answeredMap[currentQ.id] ?? "") : selectedAnswer}
            onChange={(e) => !isQAnswered && setSelectedAnswer(e.target.value)}
            disabled={isQAnswered}
            rows={5}
            placeholder="Write your response…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 resize-none disabled:opacity-60"
          />
        )}

        {/* Flag button */}
        <div className="flex items-center justify-between">
          {isQAnswered && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              ✓ Answer submitted
            </p>
          )}
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              flaggedMap[currentQ.id]
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${flaggedMap[currentQ.id] ? "fill-current" : ""}`} />
            {flaggedMap[currentQ.id] ? "Flagged" : "Flag"}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {currentQIdx > 0 && (
          <button
            onClick={handlePrevious}
            className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Previous
          </button>
        )}

        {!isQAnswered && (
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting || !selectedAnswer}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {submitting ? "Submitting…" : "Submit Answer"}
          </button>
        )}

        {isQAnswered && currentQIdx < currentQuestions.length - 1 && (
          <button
            onClick={() => {
              setCurrentQIdx((i) => i + 1);
              setSelectedAnswer("");
            }}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {allAnswered && (
          <button
            onClick={handleCompleteSection}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {loading
              ? "Loading…"
              : currentSectionIdx < totalSections - 1
              ? "Complete Section →"
              : "Finish Test"}
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Question Grid Modal */}
      <AnimatePresence>
        {showQuestionGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuestionGrid(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {currentSection} - Question Navigator
                </h3>
                <button
                  onClick={() => setShowQuestionGrid(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-slate-400">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-slate-400">Flagged</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-slate-700" />
                  <span className="text-slate-400">Unanswered</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {currentQuestions.map((q, idx) => {
                  const status = getQuestionStatus(q.id);
                  const isCurrent = idx === currentQIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                        isCurrent
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                          : "hover:scale-105"
                      } ${
                        status === "answered"
                          ? "bg-green-500 text-white"
                          : status === "flagged"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {Object.keys(answeredMap).length} answered
                </span>
                <span className="text-slate-400">
                  {Object.keys(flaggedMap).filter((k) => flaggedMap[parseInt(k)]).length} flagged
                </span>
                <span className="text-slate-400">
                  {currentQuestions.length - Object.keys(answeredMap).length} remaining
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
