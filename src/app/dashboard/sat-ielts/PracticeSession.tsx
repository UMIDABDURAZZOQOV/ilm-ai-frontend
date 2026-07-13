"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, ChevronRight, Flag, Grid3x3, Bookmark, RotateCcw, MessageSquare, BookOpen, Info, Calculator, Highlighter, MoreHorizontal, ArrowLeft } from "lucide-react";
import {
  submitAnswer,
  completeSession,
  ExamType,
  Question,
  SessionResult,
  PerQuestionResult,
} from "@/lib/satIeltsApi";
import AiAnalysisPanel from "./AiAnalysisPanel";

interface PracticeSessionProps {
  session: { session_id: number; timed: boolean; duration_seconds: number | null };
  questions: Question[];
  examType: ExamType;
  onComplete: (result: SessionResult) => void;
}

type AnsweredMap = Record<number, string>; // questionId → submitted answer
type FlaggedMap = Record<number, boolean>; // questionId → flagged status

export default function PracticeSession({
  session,
  questions,
  examType,
  onComplete,
}: PracticeSessionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answeredMap, setAnsweredMap] = useState<AnsweredMap>({});
  const [flaggedMap, setFlaggedMap] = useState<FlaggedMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    session.timed && session.duration_seconds ? session.duration_seconds : null
  );
  const [result, setResult] = useState<SessionResult | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [aiTab, setAiTab] = useState<"ask" | "explain" | "info">("ask");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const startTimeRef = useRef<number>(Date.now());

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session.timed || timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleFinishSession();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, result]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIdx];
  const isAnswered = currentQuestion
    ? answeredMap[currentQuestion.id] !== undefined
    : false;
  const allAnswered = questions.every((q) => answeredMap[q.id] !== undefined);

  const elapsed = () => Math.round((Date.now() - startTimeRef.current) / 1000) * 1000;

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || isAnswered || submitting) return;
    setSubmitting(true);
    try {
      await submitAnswer(session.session_id, {
        question_id: currentQuestion.id,
        answer: selectedAnswer,
        elapsed_ms: elapsed(),
      });
      setAnsweredMap((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
      startTimeRef.current = Date.now();
      setSelectedAnswer("");
    } catch (err: any) {
      console.error("submitAnswer error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer("");
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setSelectedAnswer("");
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    setCurrentIdx(idx);
    setSelectedAnswer("");
    setShowQuestionGrid(false);
  };

  const toggleFlag = () => {
    if (currentQuestion) {
      setFlaggedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: !prev[currentQuestion.id],
      }));
    }
  };

  const handleFinishSession = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await completeSession(session.session_id);
      setResult(res);
      onComplete(res);
    } catch (err: any) {
      console.error("completeSession error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (qId: number) => {
    const answered = answeredMap[qId] !== undefined;
    const flagged = flaggedMap[qId];
    if (answered) return "answered";
    if (flagged) return "flagged";
    return "unanswered";
  };

  const calculateEstimatedScore = () => {
    const answered = Object.keys(answeredMap).length;
    const total = questions.length;
    if (answered === 0) return null;
    // Simple estimation: assume current accuracy continues
    const correct = Object.values(answeredMap).filter((ans, idx) => {
      const q = questions.find((q) => q.id === parseInt(Object.keys(answeredMap)[idx]));
      return q && q.correct_answer === ans;
    }).length;
    const estimated = Math.round((correct / answered) * total);
    return Math.round((estimated / total) * 100);
  };

  // ── Results view ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Score summary */}
        <div className="bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-2">Session Complete</p>
          <p className="text-5xl font-black text-white mb-1">
            {Math.round(result.score_pct)}%
          </p>
          <p className="text-slate-400 text-sm">
            {result.questions_correct} / {result.questions_total} correct
          </p>
        </div>

        {/* Per-question review */}
        <div className="space-y-3">
          {result.per_question && result.per_question.map((pq: PerQuestionResult, i: number) => (
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
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  Q{i + 1}. {pq.question_text}
                </p>
              </div>
              <div className="pl-6 space-y-1 text-xs text-slate-400">
                <p>
                  Your answer:{" "}
                  <span
                    className={pq.is_correct ? "text-green-400" : "text-red-400"}
                  >
                    {pq.user_answer ?? "(no answer)"}
                  </span>
                </p>
                {!pq.is_correct && pq.correct_answer && (
                  <p>
                    Correct answer:{" "}
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

        {/* AI mistake analysis */}
        <AiAnalysisPanel sessionId={session.session_id} />
      </motion.div>
    );
  }

  // ── Active session view ────────────────────────────────────────────────────
  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Bluebook-style header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => window.history.back()}
          className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ‹ Go back
        </button>
        <button className="text-sm font-bold text-slate-600 dark:text-slate-400">Directions ▾</button>
        
        <div className="flex-1 flex flex-col items-center gap-1">
          {timeLeft !== null && (
            <>
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5">Hide</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-sm font-bold text-slate-600 dark:text-slate-400">✏ Highlight</button>
          <button className="text-sm font-bold text-slate-600 dark:text-slate-400">🧮 Calculator</button>
          <button className="text-sm font-bold text-slate-600 dark:text-slate-400">📄 Reference</button>
          <button className="text-sm font-bold text-slate-600 dark:text-slate-400">⋮ More</button>
        </div>
      </div>

      {/* Main content - 3 column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_360px] min-h-0">
        {/* Passage column */}
        {currentQuestion.passage && (
          <div className="hidden lg:block border-r border-slate-200 dark:border-slate-800 p-8 overflow-y-auto">
            <div className="text-base leading-relaxed text-slate-900 dark:text-white whitespace-pre-line">
              {currentQuestion.passage}
            </div>
          </div>
        )}

        {/* Question column */}
        <div className="border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Question number and tools */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold w-8 h-8 flex items-center justify-center rounded-md">
              {currentIdx + 1}
            </span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">🔖 Mark for Review</span>
            <button
              onClick={toggleFlag}
              className="ml-auto text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-600 dark:text-slate-300"
            >
              ⚑ Report
            </button>
          </div>

          {/* Question image */}
          {currentQuestion.image_url && (
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={currentQuestion.image_url}
                alt="Question illustration"
                className="w-full max-h-64 object-contain bg-white dark:bg-slate-800"
              />
            </div>
          )}

          {/* Question text */}
          <p className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
            {currentQuestion.question_text}
          </p>

          {/* MCQ options */}
          {currentQuestion.question_type === "mcq" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, oi) => {
                const submitted = answeredMap[currentQuestion.id];
                const isSelected = selectedAnswer === opt || submitted === opt;
                const isSubmitted = submitted !== undefined;
                const isCorrect = submitted === currentQuestion.correct_answer && opt === currentQuestion.correct_answer;
                const isWrong = submitted === opt && opt !== currentQuestion.correct_answer;

                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => !isSubmitted && setSelectedAnswer(opt)}
                      disabled={isSubmitted}
                      className={`flex-1 flex gap-3 items-start border-2 rounded-lg p-2.5 text-sm transition-all ${
                        isSubmitted
                          ? isCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : isWrong
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                          : isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold font-sans">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                    <button
                      className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-400"
                    >
                      {String.fromCharCode(65 + oi)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Answer feedback */}
          {isAnswered && (
            <div className={`rounded-lg p-3 text-sm ${
              answeredMap[currentQuestion.id] === currentQuestion.correct_answer
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              <span className={`font-bold ${
                answeredMap[currentQuestion.id] === currentQuestion.correct_answer
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {answeredMap[currentQuestion.id] === currentQuestion.correct_answer ? "✓ Correct!" : "✗ Incorrect"}
              </span>
              {currentQuestion.explanation && (
                <p className="mt-1 text-slate-600 dark:text-slate-400">{currentQuestion.explanation}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-auto">
            {!isAnswered && (
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !selectedAnswer}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
            {isAnswered && currentIdx < questions.length - 1 && (
              <button
                onClick={handleNext}
                className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-sm transition-all"
              >
                Next →
              </button>
            )}
            {allAnswered && (
              <button
                onClick={handleFinishSession}
                disabled={completing}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all"
              >
                {completing ? "Finishing…" : "Finish"}
              </button>
            )}
          </div>
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="flex flex-col min-h-0 border-l border-slate-200 dark:border-slate-800">
            {/* AI Tabs */}
            <div className="flex gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">
              <button
                onClick={() => setAiTab("ask")}
                className={`pb-1 border-b-2 ${
                  aiTab === "ask"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-slate-400"
                }`}
              >
                🤖 Ask AI
              </button>
              <button
                onClick={() => setAiTab("explain")}
                className={`pb-1 border-b-2 ${
                  aiTab === "explain"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-slate-400"
                }`}
              >
                ☰ Explanation
              </button>
              <button
                onClick={() => setAiTab("info")}
                className={`pb-1 border-b-2 ${
                  aiTab === "info"
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-slate-400"
                }`}
              >
                ⓘ Info
              </button>
            </div>

            {/* AI Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiTab === "ask" && aiMessages.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div className="text-base font-bold">How can I help?</div>
                  <div className="text-sm text-slate-400">Ask the AI tutor any question!</div>
                  <div className="flex flex-col gap-2 items-center mt-2">
                    <button className="border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-transparent rounded-full px-4 py-2 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      Highlight the key part of the passage
                    </button>
                    <button className="border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-transparent rounded-full px-4 py-2 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      Explain this step by step
                    </button>
                    <button className="border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-transparent rounded-full px-4 py-2 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      What's the best strategy for this?
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mt-auto text-center">Each conversation costs 💧 1 orb</div>
                </div>
              )}

              {aiTab === "ask" && aiMessages.length > 0 && (
                aiMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xs">🤖</div>
                    )}
                    <div className={`rounded-lg p-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {aiTab === "explain" && (
                <div className="space-y-3">
                  <div className="text-base font-bold">Step-by-step explanation</div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2.5 text-sm">
                    <span className="font-bold text-green-600 dark:text-green-400">Correct Answer:</span> {currentQuestion.correct_answer}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentQuestion.explanation || "No explanation available for this question."}
                  </div>
                </div>
              )}

              {aiTab === "info" && (
                <div className="space-y-3">
                  <div className="text-base font-bold">Question Info</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400 font-bold">Section</div>
                      <div className="font-bold">{currentQuestion.domain}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold">Difficulty</div>
                      <div className="font-bold capitalize">{currentQuestion.difficulty}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold">Domain</div>
                      <div className="font-bold">{currentQuestion.domain}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold">Skill</div>
                      <div className="font-bold">{currentQuestion.skill || "—"}</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-1">
                    <div className="text-xs text-slate-400 font-bold">Average accuracy</div>
                    <div className="text-2xl font-bold">67%</div>
                    <div className="text-xs text-slate-400">Upgrade to Pro to see solve-time stats for this question.</div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => setShowQuestionGrid(!showQuestionGrid)}
          className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-all ${
            showQuestionGrid
              ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
        <div className="flex-1 text-sm text-slate-400">
          Question {currentIdx + 1} of {questions.length}
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="text-orange-500">🔥 1</span>
          <span className="text-blue-500">💧 19</span>
        </div>
      </div>

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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Question Navigator</h3>
                <button
                  onClick={() => setShowQuestionGrid(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-600 dark:text-slate-300 transition-colors"
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
                  <div className="w-4 h-4 rounded bg-slate-300 dark:bg-slate-700" />
                  <span className="text-slate-400">Unanswered</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q.id);
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                        isCurrent
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                          : "hover:scale-105"
                      } ${
                        status === "answered"
                          ? "bg-green-500 text-white"
                          : status === "flagged"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {Object.keys(answeredMap).length} answered
                </span>
                <span className="text-slate-400">
                  {Object.keys(flaggedMap).filter((k) => flaggedMap[parseInt(k)]).length} flagged
                </span>
                <span className="text-slate-400">
                  {questions.length - Object.keys(answeredMap).length} remaining
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
