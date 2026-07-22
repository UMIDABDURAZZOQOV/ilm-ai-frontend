"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { bandColor, formatBand } from "@/lib/ieltsBand";

export interface WritingTask {
  task: 1 | 2;
  /** The boxed instruction, e.g. "The graph below gives information about…" */
  prompt: string;
  /** Chart/diagram for Task 1. */
  image_url?: string | null;
  min_words: number;            // 150 for Task 1, 250 for Task 2
  minutes: number;              // 20 / 40
  sample_answer?: string | null;
  sample_title?: string | null;
}

export interface WritingFeedback {
  band: number;
  task_achievement?: number;
  coherence?: number;
  lexical?: number;
  grammar?: number;
  feedback: string;
}

function countWords(s: string) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * IELTS Writing: prompt (+ chart) on the left, answer box on the right with a
 * live word count and AI band feedback — mirrors the real paper's layout.
 */
export default function WritingExam({
  task,
  storageKey,
  onSubmit,
}: {
  task: WritingTask;
  storageKey: string;
  /** Wire to the backend's Gemini rubric grader. */
  onSubmit: (text: string) => Promise<WritingFeedback>;
}) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSample, setShowSample] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setText(saved);
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(storageKey, text);
    } catch {
      /* ignore */
    }
  }, [text, storageKey]);

  const words = useMemo(() => countWords(text), [text]);
  const short = words > 0 && words < task.min_words;

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const fb = await onSubmit(text);
      setFeedback(fb);
      setShowFeedback(true);
    } catch {
      setError("Could not grade this answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // px-6 to match SkillExam: without it the prompt sat flush against the left edge
    // of the viewport, so "TASK 1" read as "ASK 1".
    <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden px-6">
      {/* prompt side */}
      <div className="overflow-y-auto pr-2 pt-4">
        <h2 className="text-2xl font-black mb-2">TASK {task.task}</h2>
        <p className="text-sm mb-3">You should spend about {task.minutes} minutes on this task.</p>

        <div className="border-2 border-slate-900 dark:border-neutral-600 p-4 mb-3">
          <p className="font-bold italic whitespace-pre-line">{task.prompt}</p>
        </div>

        <p className="text-sm mb-4">Write at least {task.min_words} words.</p>

        {task.image_url && (
          // The figure is fitted to the pane by default. Cambridge 20's farm plans are
          // 1000x1708 — at full column width that is about 1600px tall, so the pane
          // showed the top third and the rest was only reachable by scrolling past it
          // with nothing to say there was more. Click to see it at full size.
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.image_url}
              alt={`Task ${task.task} figure`}
              onClick={() => setZoomed((z) => !z)}
              className={`w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white ${
                zoomed ? "cursor-zoom-out" : "max-h-[55vh] object-contain cursor-zoom-in"
              }`}
            />
            <p className="text-[11px] text-slate-500 mt-1 text-center">
              {zoomed ? "Click the figure to fit it to the panel" : "Click the figure to enlarge"}
            </p>
          </div>
        )}

        {task.sample_answer && (
          <>
            <button
              onClick={() => setShowSample((s) => !s)}
              className="w-full flex items-center justify-between py-2 border-t border-slate-200 dark:border-neutral-800 font-semibold text-sm"
            >
              Sample Writing Answer
              <ChevronUp className={`w-4 h-4 transition-transform ${showSample ? "" : "rotate-180"}`} />
            </button>
            {showSample && (
              <div className="mt-3 space-y-3 text-sm leading-relaxed">
                {task.sample_title && <h3 className="text-center font-black">{task.sample_title}</h3>}
                {task.sample_answer.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* answer side */}
      <div className="flex flex-col pt-4 pl-2 border-l border-slate-200 dark:border-neutral-800 overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Please input"
          className="flex-1 min-h-[280px] w-full rounded-xl border border-slate-300 dark:border-neutral-700 bg-transparent p-3 resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3 py-3">
          <span className={`text-sm font-semibold ${short ? "text-amber-600" : ""}`}>
            Words: {words}
            {short && ` · ${task.min_words} minimum`}
          </span>
          <button
            onClick={submit}
            disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-700 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit for Feedback
          </button>
        </div>

        {error && <p className="text-sm text-red-500 pb-2">{error}</p>}

        <button
          onClick={() => setShowFeedback((s) => !s)}
          className="w-full flex items-center justify-between py-2 border-t border-slate-200 dark:border-neutral-800 font-semibold text-sm"
        >
          Writing Feedback
          <ChevronUp className={`w-4 h-4 transition-transform ${showFeedback ? "" : "rotate-180"}`} />
        </button>

        {showFeedback && feedback && (
          <div className="overflow-y-auto pt-3 space-y-3">
            <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-900 text-white">
              <span className="font-bold text-sm">Band Score</span>
              <span className="text-xl font-black" style={{ color: bandColor(feedback.band) }}>
                {formatBand(feedback.band)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Criterion label="Task Achievement" value={feedback.task_achievement} />
              <Criterion label="Coherence & Cohesion" value={feedback.coherence} />
              <Criterion label="Lexical Resource" value={feedback.lexical} />
              <Criterion label="Grammar & Accuracy" value={feedback.grammar} />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{feedback.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Criterion({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-black text-base" style={{ color: bandColor(value) }}>
        {formatBand(value)}
      </div>
    </div>
  );
}
