"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookText, Clock, Loader2 } from "lucide-react";
import {
  getReading,
  getReadingQuestions,
  type IeltsReading,
  type IeltsQuestion,
} from "@/lib/ieltsApi";
import { bookTitle, groupByTest, parseCambridgeTitle } from "@/lib/cambridge";
import ReadingExam, { type ExamPassage, type ExamQuestion } from "@/components/ielts/ReadingExam";
import FullScreenExam from "@/components/ielts/FullScreenExam";

/** The exam component takes the printed question number, which is what order_index holds. */
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

export default function IeltsReadingPage() {
  const [passages, setPassages] = useState<IeltsReading[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsReading | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null);

  useEffect(() => {
    getReading()
      .then(setPassages)
      .catch(() => setError("Could not load the reading tests."));
  }, []);

  useEffect(() => {
    if (!open) {
      setQuestions(null);
      return;
    }
    let live = true;
    getReadingQuestions(open.id)
      .then((rows) => live && setQuestions(toExamQuestions(rows)))
      .catch(() => live && setError("Could not load the questions for this passage."));
    return () => {
      live = false;
    };
  }, [open]);

  // Opened from the IELTS home as ?test=3 — show that test only, so a skill page
  // reached from a test card is that test's paper rather than the whole catalogue.
  const testFilter = Number(useSearchParams().get("test")) || null;

  const books = useMemo(
    () => groupByTest(passages ?? []).filter((g) => !testFilter || g.test === testFilter),
    [passages, testFilter]
  );

  if (open) {
    const ref = parseCambridgeTitle(open.title);
    const passage: ExamPassage = {
      section: open.section,
      title: ref?.title ?? open.title,
      subtitle: ref ? `Cambridge ${ref.book} · Test ${ref.test} · Passage ${ref.index}` : null,
      passage_text: open.passage_text,
    };

    return (
      <FullScreenExam
        title={passage.title}
        subtitle={passage.subtitle}
        onExit={() => setOpen(null)}
      >
        {questions ? (
          <ReadingExam
            passage={passage}
            questions={questions}
            storageKey={`ielts-reading-${open.id}`}
          />
        ) : (
          <div className="h-full grid place-items-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </FullScreenExam>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <BookText className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Reading
        </h1>
        <p className="text-slate-500 mt-1">
          Academic Reading practice in the real exam interface — split view, official question
          types, answer keys and a band estimate.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!passages && !error && (
        <div className="grid place-items-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {passages && !books.length && !error && (
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
                        {ref.index}. {ref.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 20 min
                        </span>
                        <span>{item.word_count ?? 0} words</span>
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
