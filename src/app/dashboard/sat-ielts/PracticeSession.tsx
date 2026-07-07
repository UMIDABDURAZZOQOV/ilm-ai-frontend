"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, ChevronRight, Flag } from "lucide-react";
import {
  submitAnswer,
  completeSession,
  ExamType,
  Question,
  SessionResult,
  PerQuestionResult,
} from "@/lib/satIeltsApi";

interface PracticeSessionProps {
  session: { session_id: number; timed: boolean; duration_seconds: number | null };
  questions: Question[];
  examType: ExamType;
  onComplete: (result: SessionResult) => void;
}

type AnsweredMap = Record<number, string>; // questionId → submitted answer

export default function PracticeSession({
  session,
  questions,
  examType,
  onComplete,
}: PracticeSessionProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answeredMap, setAnsweredMap] = useState<AnsweredMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    session.timed && session.duration_seconds ? session.duration_seconds : null
  );
  const [result, setResult] = useState<SessionResult | null>(null);
  const [completing, setCompleting] = useState(false);
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

  // ── Results view ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Score summary */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
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
          {result.per_question.map((pq: PerQuestionResult, i: number) => (
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
                <p className="text-slate-200 font-medium">
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
      </motion.div>
    );
  }

  // ── Active session view ────────────────────────────────────────────────────
  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      {/* Progress + Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span>{answeredMap ? Object.keys(answeredMap).length : 0} answered</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              className="h-full bg-blue-500 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${
              timeLeft < 60
                ? "bg-red-500/10 text-red-400"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5"
        >
          {/* Domain / difficulty badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
              {currentQuestion.domain}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
              {currentQuestion.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
              {currentQuestion.question_type.replace("_", " ")}
            </span>
          </div>

          {/* Question text */}
          <p className="text-white font-medium leading-relaxed">
            {currentQuestion.question_text}
          </p>

          {/* MCQ options */}
          {currentQuestion.question_type === "mcq" &&
            currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((opt, oi) => {
                  const submitted = answeredMap[currentQuestion.id];
                  const isSelected = selectedAnswer === opt || submitted === opt;
                  const isSubmitted = submitted !== undefined;

                  return (
                    <button
                      key={oi}
                      onClick={() => !isSubmitted && setSelectedAnswer(opt)}
                      disabled={isSubmitted}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        isSubmitted
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
          {currentQuestion.question_type === "short_answer" && (
            <input
              type="text"
              value={isAnswered ? (answeredMap[currentQuestion.id] ?? "") : selectedAnswer}
              onChange={(e) => !isAnswered && setSelectedAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600 disabled:opacity-60"
            />
          )}

          {/* Essay */}
          {currentQuestion.question_type === "essay" && (
            <textarea
              value={isAnswered ? (answeredMap[currentQuestion.id] ?? "") : selectedAnswer}
              onChange={(e) => !isAnswered && setSelectedAnswer(e.target.value)}
              disabled={isAnswered}
              rows={5}
              placeholder="Write your response…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600 resize-none disabled:opacity-60"
            />
          )}

          {/* Answered indicator */}
          {isAnswered && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Answer submitted
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!isAnswered && (
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting || !selectedAnswer}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {submitting ? "Submitting…" : "Submit Answer"}
          </button>
        )}

        {isAnswered && currentIdx < questions.length - 1 && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {allAnswered && (
          <button
            onClick={handleFinishSession}
            disabled={completing}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <Flag className="h-4 w-4" />
            {completing ? "Finishing…" : "Finish Session"}
          </button>
        )}
      </div>
    </div>
  );
}
