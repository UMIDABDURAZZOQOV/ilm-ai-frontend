"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Loader2, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getWriting, submitWriting, type IeltsWriting } from "@/lib/ieltsApi";
import { bookTitle } from "@/lib/cambridge";
import WritingExam, { type WritingFeedback, type WritingTask } from "@/components/ielts/WritingExam";
import FullScreenExam from "@/components/ielts/FullScreenExam";

/** "Cambridge 21 Test 3" → { book: 21, test: 3 } */
function parseCategory(category: string) {
  const m = /^Cambridge (\d+) Test (\d+)$/.exec(category);
  return m ? { book: Number(m[1]), test: Number(m[2]) } : null;
}

/** The grader returns "6.5 - Ideas are arranged coherently…"; the band is the lead number. */
function leadingBand(s: string | null): number | undefined {
  const m = s && /^\s*(\d(?:\.\d)?)/.exec(s);
  return m ? Number(m[1]) : undefined;
}

export default function IeltsWritingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<IeltsWriting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsWriting[] | null>(null);
  const [activeTask, setActiveTask] = useState(0);

  useEffect(() => {
    getWriting()
      .then(setTasks)
      .catch(() => setError("Could not load the writing tasks."));
  }, []);

  // Opened from the IELTS home as ?test=3 — show that test only.
  const testFilter = Number(useSearchParams().get("test")) || null;

  const tests = useMemo(() => {
    const groups = new Map<string, { book: number; test: number; items: IeltsWriting[] }>();
    for (const t of tasks ?? []) {
      const ref = parseCategory(t.category);
      if (!ref) continue;
      const key = `${ref.book}/${ref.test}`;
      let g = groups.get(key);
      if (!g) {
        g = { ...ref, items: [] };
        groups.set(key, g);
      }
      g.items.push(t);
    }
    const out = Array.from(groups.values());
    for (const g of out) g.items.sort((a, b) => a.task_type.localeCompare(b.task_type));
    return out
      .filter((g) => !testFilter || g.test === testFilter)
      .sort((a, b) => a.book - b.book || a.test - b.test);
  }, [tasks, testFilter]);

  // Arriving from a test card means "sit this paper", so open it straight away.
  useEffect(() => {
    if (!testFilter || open || tests.length !== 1) return;
    setOpen(tests[0].items);
  }, [testFilter, open, tests]);

  async function grade(text: string): Promise<WritingFeedback> {
    const task = open?.[activeTask];
    if (!task || !user) throw new Error("Sign in to get a band score.");
    const res = await submitWriting({ user_id: user.id, task_id: task.id, essay_text: text });
    return {
      band: res.band_score ?? 0,
      task_achievement: leadingBand(res.task_response),
      coherence: leadingBand(res.coherence),
      lexical: leadingBand(res.lexical),
      grammar: leadingBand(res.grammar),
      feedback: res.feedback ?? "",
    };
  }

  if (open) {
    const current = open[activeTask];
    const task: WritingTask = {
      task: current.task_type === "Task1" ? 1 : 2,
      prompt: current.prompt,
      image_url: current.image_url,
      min_words: current.min_words,
      minutes: current.duration_minutes,
    };
    return (
      <FullScreenExam
        title={`Writing — ${current.category}`}
        onExit={() => (testFilter ? router.push("/sat/ielts") : setOpen(null))}
        bottom={
          // Both tasks are one paper; the navigator switches between them.
          <div className="flex items-center justify-center gap-2 py-3">
            {open.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveTask(i)}
                className={`w-10 py-2 rounded-lg font-bold text-sm border ${
                  i === activeTask
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 dark:border-neutral-700"
                }`}
              >
                {t.task_type === "Task1" ? 1 : 2}
              </button>
            ))}
          </div>
        }
      >
        <WritingExam
          key={current.id}
          task={task}
          storageKey={`ielts-writing-${current.id}`}
          onSubmit={grade}
        />
      </FullScreenExam>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <PenLine className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Writing
        </h1>
        <p className="text-slate-500 mt-1">
          The official Task 1 and Task 2 prompts, with a live word count and an examiner-rubric
          band estimate.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!tasks && !error && (
        <div className="grid place-items-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {tasks && !tests.length && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-10 text-center text-slate-500">
          No writing tasks have been loaded yet.
        </div>
      )}

      {tests.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-center text-red-700 dark:text-red-400">
            {bookTitle(tests[0].book)} ✨
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tests.map((g) => (
              <div
                key={`${g.book}-${g.test}`}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-neutral-800 font-bold">
                  Test {g.test}
                </div>
                <div className="p-3 space-y-1">
                  {g.items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setOpen(g.items); setActiveTask(g.items.indexOf(t)); }}
                      className="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="text-sm font-semibold">
                        {t.task_type === "Task1" ? "Task 1" : "Task 2"}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {t.prompt}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.duration_minutes} min
                        </span>
                        <span>{t.min_words}+ words</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
