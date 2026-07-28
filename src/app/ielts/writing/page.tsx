"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PenTool, Clock, Send, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getWriting, submitWriting, getWritingSubmissions } from "@/lib/ieltsApi";
import type { IeltsWriting, IeltsWritingSubmission } from "@/lib/ieltsApi";
import { useAuth } from "@/hooks/useAuth";
import FocusTimerWidget from "@/components/ui/FocusTimerWidget";

export default function IeltsWritingPage() {
  const { user } = useAuth();
  const [writings, setWritings] = useState<IeltsWriting[]>([]);
  const [currentTask, setCurrentTask] = useState<IeltsWriting | null>(null);
  const [essayText, setEssayText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<IeltsWritingSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWriting().then((data) => {
      setWritings(data);
      setLoading(false);
    });
    if (user) {
      getWritingSubmissions(user.id).then((data) => {
        setSubmissions(data);
      });
    }
  }, [user]);

  const loadTask = (task: IeltsWriting) => {
    setCurrentTask(task);
    setEssayText("");
    setWordCount(0);
  };

  const handleEssayChange = (text: string) => {
    setEssayText(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  };

  const handleSubmit = async () => {
    if (!user || !currentTask) return;
    
    setSubmitting(true);
    try {
      const submission = await submitWriting({
        user_id: user.id,
        task_id: currentTask.id,
        essay_text: essayText,
      });
      setSubmissions([submission, ...submissions]);
      setCurrentTask(null);
      setEssayText("");
      setWordCount(0);
    } catch (error) {
      console.error("Failed to submit essay:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!currentTask) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ielts" className="text-sm font-bold text-slate-500 hover:text-slate-700">
            ‹ Back to IELTS
          </Link>
          <h1 className="text-3xl font-bold flex-1">Writing Practice</h1>
        </div>

        {/* Task Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {writings.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500 transition-colors"
              onClick={() => loadTask(task)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-orange-500">{task.task_type}</span>
                <span className="text-xs text-slate-500 capitalize">{task.difficulty}</span>
              </div>
              <h3 className="font-bold mb-1">{task.category}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>{task.duration_minutes} min · {task.min_words} words min</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4">Recent Submissions</h3>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Task {sub.task_id}</span>
                    {sub.band_score ? (
                      <span className="text-2xl font-bold text-orange-500">{sub.band_score.toFixed(1)}</span>
                    ) : (
                      <span className="text-sm text-slate-500">Grading...</span>
                    )}
                  </div>
                  <BandCriteria sub={sub} />
                  {sub.feedback && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{sub.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FocusTimerWidget />
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentTask(null)}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          ‹ Back to tasks
        </button>
        <h1 className="text-3xl font-bold flex-1">{currentTask.task_type}: {currentTask.category}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>{currentTask.duration_minutes} minutes</span>
        </div>
      </div>

      {/* Task Image (for Task 1) */}
      {currentTask.image_url && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <img
            src={currentTask.image_url}
            alt="Task visual"
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* Prompt */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PenTool className="h-5 w-5 text-orange-500" />
          <h2 className="font-bold">Prompt</h2>
        </div>
        <p className="text-lg leading-relaxed">{currentTask.prompt}</p>
      </div>

      {/* Essay Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold">Your Response</h2>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">Word count: {wordCount}</span>
            {wordCount < currentTask.min_words && (
              <span className="text-red-500">Minimum: {currentTask.min_words}</span>
            )}
          </div>
        </div>
        <textarea
          value={essayText}
          onChange={(e) => handleEssayChange(e.target.value)}
          placeholder="Write your essay here..."
          rows={15}
          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-base outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || wordCount < currentTask.min_words}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit for AI Grading <Send className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <h3 className="font-bold mb-3 text-blue-700 dark:text-blue-300">Tips for Success</h3>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Plan your response before you start writing</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Use clear paragraphs with topic sentences</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Include specific examples to support your points</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Leave time to review and edit your work</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// The backend grades each of the four official IELTS Writing criteria and stores
// them as strings like "6.0 - Ideas are arranged coherently…". We split the
// leading band off the description so each criterion reads as a labelled row with
// its own band chip — the detail candidates actually want, not just an overall score.
const CRITERIA: { key: keyof IeltsWritingSubmission; label: string }[] = [
  { key: "task_response", label: "Task Response" },
  { key: "coherence", label: "Coherence & Cohesion" },
  { key: "lexical", label: "Lexical Resource" },
  { key: "grammar", label: "Grammar & Accuracy" },
];

function bandChipColor(band: number): string {
  if (band >= 7) return "#16a34a";
  if (band >= 5.5) return "#f59e0b";
  return "#ef4444";
}

function BandCriteria({ sub }: { sub: IeltsWritingSubmission }) {
  const rows = CRITERIA.map(({ key, label }) => {
    const raw = sub[key];
    if (typeof raw !== "string" || !raw.trim()) return null;
    const m = raw.match(/^\s*(\d+(?:\.\d+)?)\s*[-–—:]?\s*([\s\S]*)$/);
    const band = m ? parseFloat(m[1]) : null;
    const text = m ? m[2].trim() : raw.trim();
    return { label, band, text };
  }).filter(Boolean) as { label: string; band: number | null; text: string }[];

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2 mt-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-2.5">
          {r.band !== null ? (
            <span
              className="shrink-0 w-9 text-center text-xs font-black text-white rounded-md py-0.5"
              style={{ backgroundColor: bandChipColor(r.band) }}
            >
              {r.band.toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 w-9" />
          )}
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.label}</span>
            {r.text && <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{r.text}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
