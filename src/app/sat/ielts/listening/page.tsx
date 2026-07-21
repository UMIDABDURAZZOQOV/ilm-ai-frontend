"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Headphones, Loader2, Volume2 } from "lucide-react";
import {
  getListening,
  getListeningQuestions,
  type IeltsListening,
  type IeltsQuestion,
} from "@/lib/ieltsApi";
import { bookTitle, groupByTest, parseCambridgeTitle } from "@/lib/cambridge";
import ListeningExam, { type ListeningSection } from "@/components/ielts/ListeningExam";
import type { ExamQuestion } from "@/components/ielts/ReadingExam";

function toExamQuestions(rows: IeltsQuestion[]): ExamQuestion[] {
  return rows
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      id: q.id,
      number: q.order_index,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      group_instruction: q.hint,
    }));
}

export default function IeltsListeningPage() {
  const [parts, setParts] = useState<IeltsListening[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsListening | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null);

  useEffect(() => {
    getListening()
      .then(setParts)
      .catch(() => setError("Could not load the listening tests."));
  }, []);

  useEffect(() => {
    if (!open) {
      setQuestions(null);
      return;
    }
    let live = true;
    getListeningQuestions(open.id)
      .then((rows) => live && setQuestions(toExamQuestions(rows)))
      .catch(() => live && setError("Could not load the questions for this part."));
    return () => {
      live = false;
    };
  }, [open]);

  const books = useMemo(() => groupByTest(parts ?? []), [parts]);

  if (open) {
    const ref = parseCambridgeTitle(open.title);
    const section: ListeningSection = {
      section: open.section,
      title: ref?.title ?? open.title,
      audio_url: open.audio_url,
      audio_parts: open.audio_parts,
      transcript: open.transcript,
    };

    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <button
          onClick={() => setOpen(null)}
          className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> All parts
        </button>
        {questions ? (
          <ListeningExam
            section={section}
            questions={questions}
            storageKey={`ielts-listening-${open.id}`}
          />
        ) : (
          <div className="flex-1 grid place-items-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Headphones className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Listening
        </h1>
        <p className="text-slate-500 mt-1">
          The official recordings with the printed questions, the audioscript and an instant band
          estimate.
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
          No practice tests have been loaded yet.
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
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Volume2 className="w-3 h-3" />
                        {item.audio_url ? "Official recording" : "No audio"}
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
