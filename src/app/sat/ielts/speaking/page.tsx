"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Mic } from "lucide-react";
import { getSpeaking, type IeltsSpeaking } from "@/lib/ieltsApi";
import { bookTitle, groupByTest, parseCambridgeTitle } from "@/lib/cambridge";
import SpeakingExam, { type SpeakingPart } from "@/components/ielts/SpeakingExam";

const PART_INTRO: Record<number, string> = {
  1: "The examiner asks you about yourself, your home, work or studies and other familiar topics.",
  2: "You will have to talk about the topic for 1 to 2 minutes. You have 1 minute to think about what you are going to say. You can make some notes to help you if you wish.",
  3: "Discussion topics — the examiner asks broader questions related to the Part 2 topic.",
};

export default function IeltsSpeakingPage() {
  const [parts, setParts] = useState<IeltsSpeaking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsSpeaking | null>(null);

  useEffect(() => {
    getSpeaking()
      .then(setParts)
      .catch(() => setError("Could not load the speaking topics."));
  }, []);

  const books = useMemo(() => groupByTest(parts ?? [], (p) => p.topic), [parts]);

  if (open) {
    const ref = parseCambridgeTitle(open.topic);
    const part: SpeakingPart = {
      part: (open.part as 1 | 2 | 3) ?? 1,
      intro: PART_INTRO[open.part] ?? "",
      topic: ref?.title ?? open.topic,
      // Part 2 has no question list — the cue card is the prompt.
      questions: open.questions?.length ? open.questions : open.cue_card ? [open.cue_card] : [],
      prep_seconds: open.prep_seconds ?? undefined,
      speak_seconds: open.speak_seconds ?? undefined,
    };
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpen(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> All topics
        </button>
        {/* No `onSubmit`: the backend cannot transcribe audio yet, so the recorder is for
            self-review only rather than showing a band score it cannot actually judge. */}
        <SpeakingExam part={part} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Mic className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Speaking
        </h1>
        <p className="text-slate-500 mt-1">
          The official Part 1–3 topics and cue cards, with a timer and a recorder so you can play
          your answer back.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!parts && !error && (
        <div className="grid place-items-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {parts && !books.length && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-10 text-center text-slate-500">
          No speaking topics have been loaded yet.
        </div>
      )}

      {books.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-center text-red-700 dark:text-red-400">
            {bookTitle(books[0].book)} ✨
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((g) => (
              <div
                key={`${g.book}-${g.test}`}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-neutral-800 font-bold">
                  Test {g.test}
                </div>
                <div className="p-3 space-y-1">
                  {g.items.map(({ ref, item }) => (
                    <button
                      key={item.id}
                      onClick={() => setOpen(item)}
                      className="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="text-sm font-semibold leading-snug">
                        Part {ref.index}. {ref.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.questions?.length
                          ? `${item.questions.length} questions`
                          : "Cue card"}
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
