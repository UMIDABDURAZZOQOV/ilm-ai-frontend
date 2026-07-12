"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
  LayoutGrid,
  Pencil,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  submitAnswer,
  completeSession,
  startSession,
  type SessionStartResponse,
  type SessionResult,
  type Question,
} from "@/lib/satIeltsApi";
import AiAnalysisPanel from "@/app/dashboard/sat-ielts/AiAnalysisPanel";
import { MathText } from "@/components/MathText";

interface PlanStep {
  section: string;
  label: string;
  questions: number;
  minutes: number;
}

interface SectionResult {
  label: string;
  session_id: number;
  score_pct: number;
  correct: number;
  total: number;
  per_question: SessionResult["per_question"];
}

interface MockPlan {
  examType: "SAT" | "IELTS";
  title: string;
  steps: PlanStep[];
  index: number;
  results: SectionResult[];
}

interface StoredSession {
  session: SessionStartResponse;
  mode: string;
  label: string;
  plan?: MockPlan;
}

type Phase = "loading" | "missing" | "exam" | "submitting" | "section_break" | "done";

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function optionLetter(opt: string, index: number): string {
  const match = opt.match(/^([A-D])\)/);
  return match ? match[1] : String.fromCharCode(65 + index);
}

function optionBody(opt: string): string {
  return opt.replace(/^[A-D]\)\s*/, "");
}

function scoreColor(pct: number): string {
  return pct >= 70 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500";
}
function scoreStroke(pct: number): string {
  return pct >= 70 ? "stroke-emerald-500" : pct >= 40 ? "stroke-amber-500" : "stroke-red-500";
}
function scoreBar(pct: number): string {
  return pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
}

export default function SatSessionPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [stored, setStored] = useState<StoredSession | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [eliminated, setEliminated] = useState<Record<number, Set<string>>>({});
  const [crossOutMode, setCrossOutMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questionEnteredAt = useRef<number>(Date.now());
  const elapsedPerQuestion = useRef<Record<number, number>>({});
  const finishingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sat_session");
      if (!raw) return setPhase("missing");
      const parsed: StoredSession = JSON.parse(raw);
      if (!parsed?.session?.questions?.length) return setPhase("missing");
      setStored(parsed);
      setPhase("exam");
      questionEnteredAt.current = Date.now();
    } catch {
      setPhase("missing");
    }
  }, []);

  const session = stored?.session ?? null;
  const questions: Question[] = session?.questions ?? [];
  const question = questions[current] ?? null;
  const timed = !!session?.timed && !!session?.duration_seconds;
  const remaining = timed ? (session!.duration_seconds as number) - elapsed : null;
  const plan = stored?.plan ?? null;
  const hasNextSection = !!plan && plan.index < plan.steps.length - 1;

  useEffect(() => {
    if (phase !== "exam") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const bankTimeFor = useCallback((qid: number) => {
    const now = Date.now();
    elapsedPerQuestion.current[qid] =
      (elapsedPerQuestion.current[qid] || 0) + (now - questionEnteredAt.current);
    questionEnteredAt.current = now;
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (!question) return;
      bankTimeFor(question.id);
      setCurrent(index);
      setPaletteOpen(false);
    },
    [question, bankTimeFor]
  );

  const finishExam = useCallback(async () => {
    if (!session || !stored || finishingRef.current) return;
    finishingRef.current = true;
    if (question) bankTimeFor(question.id);
    setConfirmFinish(false);
    setPhase("submitting");
    setSubmitError(null);
    try {
      for (const q of questions) {
        const answer = answers[q.id];
        if (answer == null) continue;
        await submitAnswer(session.session_id, {
          question_id: q.id,
          answer,
          elapsed_ms: Math.round(elapsedPerQuestion.current[q.id] || 0),
        });
      }
      const res = await completeSession(session.session_id);
      setResult(res);

      if (plan) {
        const sr: SectionResult = {
          label: stored.label,
          session_id: session.session_id,
          score_pct: res.score_pct,
          correct: res.questions_correct,
          total: res.questions_total,
          per_question: res.per_question,
        };
        const nextResults = [...plan.results, sr];
        const nextPlan = { ...plan, results: nextResults };
        setStored({ ...stored, plan: nextPlan });
        if (plan.index < plan.steps.length - 1) {
          setPhase("section_break");
        } else {
          setPhase("done");
          sessionStorage.removeItem("sat_session");
        }
      } else {
        setPhase("done");
        sessionStorage.removeItem("sat_session");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Could not submit the session. Please try again.");
      setPhase("exam");
      finishingRef.current = false;
    }
  }, [session, stored, plan, questions, answers, question, bankTimeFor]);

  const startNextSection = useCallback(async () => {
    if (!stored || !plan || !user) return;
    const next = plan.steps[plan.index + 1];
    setPhase("submitting");
    setSubmitError(null);
    try {
      const res = await startSession({
        user_id: user.id,
        exam_type: plan.examType,
        section: next.section,
        difficulty: "medium",
        num_questions: next.questions,
        timed: true,
        duration_seconds: next.minutes * 60,
      });
      const updated: StoredSession = {
        ...stored,
        session: res,
        label: next.label,
        plan: { ...plan, index: plan.index + 1 },
      };
      setStored(updated);
      sessionStorage.setItem("sat_session", JSON.stringify(updated));
      // Reset all per-section exam state.
      setCurrent(0);
      setAnswers({});
      setFlagged(new Set());
      setEliminated({});
      setCrossOutMode(false);
      setElapsed(0);
      setResult(null);
      elapsedPerQuestion.current = {};
      questionEnteredAt.current = Date.now();
      finishingRef.current = false;
      setPhase("exam");
    } catch (err: any) {
      setSubmitError(err.message || "Could not start the next section.");
      setPhase("section_break");
    }
  }, [stored, plan, user]);

  useEffect(() => {
    if (phase === "exam" && timed && remaining !== null && remaining <= 0) {
      finishExam();
    }
  }, [phase, timed, remaining, finishExam]);

  function selectAnswer(opt: string) {
    if (!question) return;
    if (crossOutMode) return toggleEliminate(opt);
    setAnswers((prev) => ({ ...prev, [question.id]: opt }));
    setEliminated((prev) => {
      const set = prev[question.id];
      if (!set?.has(opt)) return prev;
      const next = new Set(set);
      next.delete(opt);
      return { ...prev, [question.id]: next };
    });
  }

  function toggleEliminate(opt: string) {
    if (!question) return;
    setEliminated((prev) => {
      const set = new Set(prev[question.id] ?? []);
      set.has(opt) ? set.delete(opt) : set.add(opt);
      return { ...prev, [question.id]: set };
    });
    setAnswers((prev) => {
      if (prev[question.id] !== opt) return prev;
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
  }

  function toggleFlag() {
    if (!question) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(question.id) ? next.delete(question.id) : next.add(question.id);
      return next;
    });
  }

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] != null).length,
    [questions, answers]
  );

  // ── Loading / missing ────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8">
        <p className="text-lg font-bold">No active session</p>
        <p className="text-sm text-slate-500 max-w-sm text-center">
          Start a practice set or a mock test to open the exam view.
        </p>
        <div className="flex gap-3">
          <Link href="/sat/bank" className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold">
            Question Bank
          </Link>
          <Link href="/sat/mock" className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold">
            Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold">Working…</p>
      </div>
    );
  }

  // ── Between-section break (full-length mock) ─────────────────────────────────
  if (phase === "section_break" && plan && result) {
    const done = plan.index + 1;
    const totalSteps = plan.steps.length;
    const next = plan.steps[plan.index + 1];
    const pct = Math.round(result.score_pct);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center"
        >
          <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Section {done} of {totalSteps} complete
          </p>
          <h2 className="text-2xl font-black mt-1">{stored?.label}</h2>
          <p className={`text-4xl font-black mt-4 ${scoreColor(pct)}`}>{pct}%</p>
          <p className="text-sm text-slate-500 mt-1">
            {result.questions_correct} / {result.questions_total} correct
          </p>

          <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Up next</p>
            <p className="font-bold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" /> {next.label} · {next.questions} questions · {next.minutes} min
            </p>
          </div>

          {submitError && <p className="text-red-500 text-sm mt-3">{submitError}</p>}

          <button
            onClick={startNextSection}
            className="mt-6 w-full px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Start {next.label} section
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Result view ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    // Combined (multi-section mock) vs single-session result.
    const sections: SectionResult[] = plan
      ? plan.results
      : result
      ? [
          {
            label: stored?.label || "Practice",
            session_id: result.session_id,
            score_pct: result.score_pct,
            correct: result.questions_correct,
            total: result.questions_total,
            per_question: result.per_question,
          },
        ]
      : [];

    const totalCorrect = sections.reduce((s, x) => s + x.correct, 0);
    const totalQ = sections.reduce((s, x) => s + x.total, 0);
    const overallPct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
    const title = plan ? plan.title : stored?.label || "Practice";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="max-w-3xl mx-auto p-6 sm:p-10 space-y-6">
          <Link href="/sat" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to SAT home
          </Link>

          {/* Overall score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title} · Complete</p>
            <div className="relative h-32 w-32 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(overallPct / 100) * 264} 264`}
                  className={scoreStroke(overallPct)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black">{overallPct}%</span>
              </div>
            </div>
            <p className="font-bold text-lg">{totalCorrect} / {totalQ} correct</p>
            {plan && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {sections.map((s) => (
                  <span key={s.session_id} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-semibold">
                    {s.label}: <span className={scoreColor(Math.round(s.score_pct))}>{Math.round(s.score_pct)}%</span>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Per-section review + AI analysis */}
          {sections.map((s) => (
            <div key={s.session_id} className="space-y-3">
              {plan && (
                <div className="flex items-center gap-3 pt-2">
                  <h3 className="font-black text-lg">{s.label}</h3>
                  <span className={`text-sm font-bold ${scoreColor(Math.round(s.score_pct))}`}>
                    {Math.round(s.score_pct)}%
                  </span>
                </div>
              )}
              {s.per_question?.map((pq, i) => (
                <div
                  key={pq.question_id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 ${
                    pq.is_correct ? "border-emerald-200 dark:border-emerald-800/40" : "border-red-200 dark:border-red-800/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-white ${pq.is_correct ? "bg-emerald-500" : "bg-red-500"}`}>
                      {pq.is_correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-bold text-slate-400">
                        Question {i + 1}{pq.domain ? ` · ${pq.domain}` : ""}
                      </p>
                      <MathText className="text-sm whitespace-pre-wrap font-serif-sat">{pq.question_text}</MathText>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-slate-400">Your answer: </span>
                          <span className={pq.is_correct ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"}>
                            {pq.user_answer ?? "— (skipped)"}
                          </span>
                        </p>
                        {!pq.is_correct && pq.correct_answer && (
                          <p>
                            <span className="text-slate-400">Correct answer: </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{pq.correct_answer}</span>
                          </p>
                        )}
                      </div>
                      {pq.explanation && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Explanation</p>
                          <MathText className="whitespace-pre-wrap">{pq.explanation}</MathText>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <AiAnalysisPanel sessionId={s.session_id} />
            </div>
          ))}

          <div className="flex gap-3 pb-10">
            <Link href="/sat/mock" className="flex-1 text-center px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              Another test
            </Link>
            <Link href="/sat/analytics" className="flex-1 text-center px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all">
              View analytics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  // ── Exam view (Bluebook style) ───────────────────────────────────────────────
  const qElim = eliminated[question.id] ?? new Set<string>();
  const isLong = question.question_text.length > 320;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 sm:px-6 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            {stored?.label || "SAT Practice"}
            {plan && <span className="text-slate-400 font-normal"> · Section {plan.index + 1}/{plan.steps.length}</span>}
          </p>
          <p className="text-[11px] text-slate-400 -mt-0.5">
            {stored?.mode === "mock" ? "Mock test" : "Practice"} · {questions.length} questions
          </p>
        </div>
        <div className={`flex items-center gap-2 font-bold tabular-nums ${timed && remaining !== null && remaining <= 60 ? "text-red-500" : ""}`}>
          <Clock className="h-4 w-4" />
          {timed ? formatClock(remaining ?? 0) : formatClock(elapsed)}
        </div>
        <div className="flex-1 flex justify-end">
          {submitError ? (
            <button onClick={finishExam} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all">
              Retry submit
            </button>
          ) : (
            <button onClick={() => setConfirmFinish(true)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              Finish
            </button>
          )}
        </div>
      </header>

      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-6 py-2">
          {submitError}
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className={`mx-auto p-4 sm:p-8 ${isLong ? "max-w-6xl lg:grid lg:grid-cols-2 lg:gap-10" : "max-w-3xl"}`}>
          <div className={isLong ? "lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-10 mb-6 lg:mb-0" : "mb-6"}>
            <MathText className="whitespace-pre-wrap font-serif-sat leading-[1.75] text-[16.5px]">{question.question_text}</MathText>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center font-black text-sm">
                  {current + 1}
                </span>
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    flagged.has(question.id)
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" fill={flagged.has(question.id) ? "currentColor" : "none"} />
                  Mark for Review
                </button>
              </div>
              {question.options && (
                <button
                  onClick={() => setCrossOutMode((v) => !v)}
                  title="Cross out answer choices"
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    crossOutMode
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="line-through">ABC</span>
                </button>
              )}
            </div>

            {question.options ? (
              <div className="space-y-3">
                {question.options.map((opt, oi) => {
                  const selected = answers[question.id] === opt;
                  const crossed = qElim.has(opt);
                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <button
                        onClick={() => selectAnswer(opt)}
                        className={`flex-1 flex items-center gap-3 text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                          selected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        } ${crossed ? "opacity-40" : ""}`}
                      >
                        <span className={`h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                          selected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                        }`}>
                          {optionLetter(opt, oi)}
                        </span>
                        <MathText className={`text-[15px] font-serif-sat ${crossed ? "line-through" : ""}`}>{optionBody(opt)}</MathText>
                      </button>
                      {crossOutMode && (
                        <button
                          onClick={() => toggleEliminate(opt)}
                          className="h-8 w-8 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 transition-all"
                          title={crossed ? "Undo cross-out" : "Cross out"}
                        >
                          {crossed ? <Pencil className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[question.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Type your answer…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 outline-none text-sm"
              />
            )}
          </div>
        </div>
      </main>

      <footer className="h-16 shrink-0 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 relative">
        <button
          onClick={() => goTo(Math.max(0, current - 1))}
          disabled={current === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold disabled:opacity-30 hover:border-slate-400 transition-all"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <button
          onClick={() => setPaletteOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <LayoutGrid className="h-4 w-4" />
          Question {current + 1} of {questions.length}
        </button>

        <button
          onClick={() => (current === questions.length - 1 ? setConfirmFinish(true) : goTo(current + 1))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
        >
          {current === questions.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {paletteOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 w-[min(92vw,26rem)] z-20"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">{stored?.label || "Questions"}</p>
                <button onClick={() => setPaletteOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-600 inline-block" /> Answered</span>
                <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-amber-500" fill="currentColor" /> Marked</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-dashed border-slate-400 inline-block" /> Unanswered</span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {questions.map((q, qi) => {
                  const isAnswered = answers[q.id] != null;
                  const isFlagged = flagged.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(qi)}
                      className={`relative h-9 rounded-lg text-xs font-bold transition-all ${
                        qi === current ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900" : ""
                      } ${isAnswered ? "bg-blue-600 text-white" : "border border-dashed border-slate-300 dark:border-slate-600 text-slate-500"}`}
                    >
                      {qi + 1}
                      {isFlagged && <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500" fill="currentColor" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      <AnimatePresence>
        {confirmFinish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
            onClick={() => setConfirmFinish(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800"
            >
              <h3 className="font-bold text-lg mb-2">
                {hasNextSection ? "Finish this section?" : "Finish and score?"}
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                You answered {answeredCount} of {questions.length} questions.
                {answeredCount < questions.length && ` ${questions.length - answeredCount} unanswered will be marked wrong.`}
                {hasNextSection && " You'll move on to the next section."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmFinish(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-slate-400 transition-all">
                  Keep working
                </button>
                <button onClick={finishExam} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                  {hasNextSection ? "Next section" : "Finish"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
