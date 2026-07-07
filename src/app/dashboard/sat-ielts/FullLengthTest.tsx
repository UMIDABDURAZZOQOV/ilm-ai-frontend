"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, ChevronRight } from "lucide-react";
import {
  startFullTest,
  completeSectionTest,
  completeFullTest,
  submitAnswer,
  ExamType,
  Question,
  FullTestStartResponse,
  FullTestCompleteResponse,
} from "@/lib/satIeltsApi";

interface User {
  id: number;
  name: string;
  email: string;
}

interface FullLengthTestProps {
  user: User;
  examType: ExamType;
  isPremium: boolean;
  onComplete: (result: FullTestCompleteResponse) => void;
}

type TestPhase = "idle" | "active" | "section_done" | "done";

export default function FullLengthTest({
  user,
  examType,
  isPremium,
  onComplete,
}: FullLengthTestProps) {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [testData, setTestData] = useState<FullTestStartResponse | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullTestCompleteResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setCurrentQuestions(data.questions);
      setCurrentSectionIdx(0);
      setCurrentQIdx(0);
      setAnsweredMap({});
      setSelectedAnswer("");
      setTimeLeft(data.section_duration_seconds);
      setPhase("active");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!testData || !selectedAnswer || submitting) return;
    const q = currentQuestions[currentQIdx];
    if (!q || answeredMap[q.id] !== undefined) return;
    setSubmitting(true);
    try {
      await submitAnswer(testData.test_id, {
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
    if (!testData) return;
    setLoading(true);
    try {
      const sections = testData.sections;
      const currentSection = sections[currentSectionIdx];
      const res = await completeSectionTest(testData.test_id, currentSection);

      if (res.next_section && res.questions) {
        setCurrentSectionIdx((i) => i + 1);
        setCurrentQuestions(res.questions);
        setCurrentQIdx(0);
        setAnsweredMap({});
        setSelectedAnswer("");
        setTimeLeft(res.section_duration_seconds);
        setPhase("active");
      } else {
        // Last section — complete the full test
        const finalResult = await completeFullTest(testData.test_id);
        setResult(finalResult);
        setPhase("done");
        onComplete(finalResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentSection = testData?.sections[currentSectionIdx] ?? "";
  const totalSections = testData?.sections.length ?? 0;
  const currentQ = currentQuestions[currentQIdx];
  const isQAnswered = currentQ ? answeredMap[currentQ.id] !== undefined : false;
  const allAnswered = currentQuestions.every((q) => answeredMap[q.id] !== undefined);

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

        {result.section_scores && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-300">Section Breakdown</h4>
            {Object.entries(result.section_scores).map(([section, pct]) => (
              <div key={section} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{section}</span>
                <span className="text-white font-bold">{Math.round(Number(pct))}%</span>
              </div>
            ))}
          </div>
        )}
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
        {timeLeft !== null && (
          <span
            className={`text-sm font-bold ${
              timeLeft < 60 ? "text-red-400" : "text-slate-300"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        )}
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
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
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
    </div>
  );
}
