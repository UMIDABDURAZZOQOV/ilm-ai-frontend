"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Headphones, Loader2, Volume2 } from "lucide-react";
import {
  getListening,
  getListeningQuestions,
  type IeltsListening,
  type IeltsQuestion,
} from "@/lib/ieltsApi";
import { bookTitle, groupByTest, parseCambridgeTitle } from "@/lib/cambridge";
import ListeningExam, { type ListeningSection } from "@/components/ielts/ListeningExam";
import type { ExamQuestion } from "@/components/ielts/ReadingExam";
import FullScreenExam from "@/components/ielts/FullScreenExam";
import SkillExam, { type SkillSection } from "@/components/ielts/SkillExam";

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
  const router = useRouter();
  const [parts, setParts] = useState<IeltsListening[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<IeltsListening[] | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[][] | null>(null);

  useEffect(() => {
    getListening()
      .then(setParts)
      .catch(() => setError("Could not load the listening tests."));
  }, []);

  // A test's whole Listening paper is one exam: 4 parts, 40 questions, one band.
  // Scoring a part on its own gives a mark out of 10, which is not a band.
  useEffect(() => {
    if (!open) {
      setQuestions(null);
      return;
    }
    let live = true;
    Promise.all(open.map((p) => getListeningQuestions(p.id)))
      .then((lists) => live && setQuestions(lists.map(toExamQuestions)))
      .catch(() => live && setError("Could not load the questions for this test."));
    return () => {
      live = false;
    };
  }, [open]);

  // Opened from the IELTS home as ?test=3 — show that test only, so a skill page
  // reached from a test card is that test's paper rather than the whole catalogue.
  const params = useSearchParams();
  const testFilter = Number(params.get("test")) || null;
  // Two books now ship a "Test 1", so the test number alone no longer identifies a
  // paper: opening Cambridge 20 Test 1 listed Cambridge 21's Test 1 beside it, and the
  // "one match, open it straight away" shortcut stopped firing because there were two.
  const bookFilter = Number(params.get("book")) || null;

  const books = useMemo(
    () => groupByTest(parts ?? []).filter(
      (g) => (!testFilter || g.test === testFilter) && (!bookFilter || g.book === bookFilter)),
    [parts, testFilter, bookFilter]
  );

  // Arriving from a test card means "sit this paper", so open it rather than showing a
  // list of its parts — the parts are switched from the navigator inside the exam.
  useEffect(() => {
    if (!testFilter || open || books.length !== 1) return;
    setOpen(books[0].items.map((x) => x.item));
  }, [testFilter, open, books]);

  if (open) {
    const ref = parseCambridgeTitle(open[0].title);
    const sections: SkillSection[] = (questions ?? []).map((qs, i) => ({
      index: i + 1,
      label: parseCambridgeTitle(open[i].title)?.title ?? `Part ${i + 1}`,
      questions: qs,
    }));

    return (
      <FullScreenExam
        title={`Listening — Test ${ref?.test ?? ""}`}
        subtitle={ref ? `Cambridge ${ref.book}` : null}
        onExit={() => (testFilter ? router.push("/sat/ielts") : setOpen(null))}
      >
        {sections.length ? (
          <SkillExam
            skill="listening"
            book={ref?.book}
            test={ref?.test}
            storageKey={`ielts-listening-test-${ref?.book}-${ref?.test}`}
            sections={sections}
            render={(section, ctl) => {
              const p = open[section.index - 1];
              const r = parseCambridgeTitle(p.title);
              return (
                <ListeningExam
                  section={{
                    section: p.section,
                    title: r?.title ?? p.title,
                    audio_url: p.audio_url,
                    audio_parts: p.audio_parts,
                    transcript: p.transcript,
                    tables: p.tables,
                  }}
                  questions={section.questions}
                  storageKey={`ielts-listening-${p.id}`}
                  {...ctl}
                />
              );
            }}
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
                      onClick={() => setOpen(g.items.map((x) => x.item))}
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
