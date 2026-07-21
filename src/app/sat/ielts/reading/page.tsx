"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { ArrowLeft, BookText, Clock } from "lucide-react";
import { IELTS_READING, type IeltsPassage } from "@/lib/ielts";
import ReadingExam, { type ExamPassage, type ExamQuestion } from "@/components/ielts/ReadingExam";

/** Map the bundled sample passages onto the exam component's shape. */
function toExam(p: IeltsPassage, index: number): { passage: ExamPassage; questions: ExamQuestion[] } {
  const passage: ExamPassage = {
    section: ((index % 3) + 1) as 1 | 2 | 3,
    title: p.title,
    passage_text: p.paragraphs.join("\n\n"),
  };

  const questions: ExamQuestion[] = p.questions.map((q, i) => ({
    id: i + 1,
    number: i + 1,
    question_type: q.type,
    question_text: q.prompt,
    options: q.options ?? null,
    correct_answer: q.answer,
    group_instruction:
      q.type === "tfng"
        ? "Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN."
        : q.type === "mcq"
        ? "Choose the correct letter, A, B, C or D."
        : "Complete the sentence below. Choose ONE WORD ONLY from the passage.",
  }));

  return { passage, questions };
}

export default function IeltsReadingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const exam = useMemo(
    () => (openIndex === null ? null : toExam(IELTS_READING[openIndex], openIndex)),
    [openIndex]
  );

  if (exam && openIndex !== null) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <button
          onClick={() => setOpenIndex(null)}
          className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> All passages
        </button>
        <ReadingExam
          passage={exam.passage}
          questions={exam.questions}
          storageKey={`ielts-reading-${IELTS_READING[openIndex].id}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <BookText className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> IELTS Reading
        </h1>
        <p className="text-slate-500 mt-1">
          Academic Reading practice in the real exam interface — split view, official question types,
          answer keys and a band estimate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {IELTS_READING.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setOpenIndex(i)}
            className="text-left rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 hover:border-slate-400 transition-colors"
          >
            <div className="font-bold text-lg mb-1">{p.title}</div>
            <div className="text-sm text-slate-500 flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {p.minutes} min
              </span>
              <span>{p.questions.length} questions</span>
              <span>{p.level}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
