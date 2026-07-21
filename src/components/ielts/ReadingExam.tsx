"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, FileText, Highlighter, KeyRound, X } from "lucide-react";
import { bandColor, formatBand, rawToBand } from "@/lib/ieltsBand";

/** Question shape mirrors the backend `ielts_questions` table. */
export type IeltsQuestionType = "mcq" | "tfng" | "ynng" | "completion" | "matching" | "heading";

export interface ExamQuestion {
  id: number;
  number: number;                 // 1–40, as printed on the answer sheet
  question_type: IeltsQuestionType;
  question_text: string;
  options?: string[] | null;      // MCQ choices / heading list / matching letters
  correct_answer: string;
  group_instruction?: string | null; // e.g. "Choose ONE WORD ONLY from the passage"
}

export interface ExamPassage {
  section: number;                // 1–3
  title: string;
  subtitle?: string | null;
  passage_text: string;           // paragraphs separated by blank lines; "A\n..." for lettered sections
}

/** The seeder writes gaps as a run of underscores; the input is rendered in its place. */
const GAP_MARK = "________";

const TFNG = ["TRUE", "FALSE", "NOT GIVEN"];
const YNNG = ["YES", "NO", "NOT GIVEN"];

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** A learner answer counts if it matches any of the accepted variants ("a/an cat"). */
export function isCorrect(given: string, correct: string) {
  if (!given) return false;
  const accepted = correct.split(/\s*\/\s*|\s*\|\s*/).map(norm);
  return accepted.includes(norm(given));
}

export default function ReadingExam({
  passage,
  questions,
  storageKey,
  onFinished,
  answers: controlledAnswers,
  onAnswerChange,
  scoreQuestions,
}: {
  passage: ExamPassage;
  questions: ExamQuestion[];
  /** localStorage key so answers survive a refresh, like Jumpinto's autosave. */
  storageKey: string;
  onFinished?: (raw: number, band: number) => void;
  /** Controlled mode: the parent owns the answers so one score can span the whole
      skill (40 questions across every part), the way the real paper is marked. */
  answers?: Record<number, string>;
  onAnswerChange?: (number: number, value: string) => void;
  /** Every question in the skill, when the band must be computed over all of them. */
  scoreQuestions?: ExamQuestion[];
}) {
  const [ownAnswers, setOwnAnswers] = useState<Record<number, string>>({});
  const controlled = controlledAnswers !== undefined;
  const answers = controlled ? controlledAnswers! : ownAnswers;
  const [showKeys, setShowKeys] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [guided, setGuided] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const loaded = useRef(false);

  // ── autosave ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (controlled) return;          // the parent persists in controlled mode
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setOwnAnswers(JSON.parse(raw));
    } catch {
      /* ignore corrupt cache */
    }
    loaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current || controlled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      setSavedAt(new Date().toLocaleString());
    } catch {
      /* quota — not fatal */
    }
  }, [answers, storageKey]);

  // The band is a property of the whole paper (40 questions), never of one part.
  const scored = scoreQuestions ?? questions;
  const raw = useMemo(
    () => scored.reduce((n, q) => (isCorrect(answers[q.number] || "", q.correct_answer) ? n + 1 : n), 0),
    [answers, scored]
  );
  // A single passage is a third of the paper; band is only meaningful over all 40.
  const band = rawToBand(Math.round((raw / Math.max(1, scored.length)) * 40), "reading");

  function setAnswer(number: number, value: string) {
    if (onAnswerChange) onAnswerChange(number, value);
    else setOwnAnswers((a) => ({ ...a, [number]: value }));
  }

  // ── passage rendering ─────────────────────────────────────────────────────
  const paragraphs = useMemo(() => passage.passage_text.split(/\n{2,}/), [passage.passage_text]);

  // Group consecutive questions that share an instruction, the way the real paper does.
  const groups = useMemo(() => {
    const out: { instruction: string | null; items: ExamQuestion[] }[] = [];
    for (const q of questions) {
      const ins = q.group_instruction ?? null;
      const last = out[out.length - 1];
      if (last && last.instruction === ins) last.items.push(q);
      else out.push({ instruction: ins, items: [q] });
    }
    return out;
  }, [questions]);

  return (
    <div className="flex flex-col h-full">
      {/* toolbar */}
      <div className="flex items-center justify-center gap-4 py-2 border-b border-slate-200 dark:border-neutral-800">
        <button title="Passage" className="p-1.5 text-emerald-600"><FileText className="w-5 h-5" /></button>
        <button title="Vocabulary" className="p-1.5 text-emerald-600"><BookOpen className="w-5 h-5" /></button>
        <button
          title="Toggle guided mode"
          onClick={() => setGuided((g) => !g)}
          className={`p-1.5 ${guided ? "text-amber-500" : "text-emerald-600"}`}
        >
          <Highlighter className="w-5 h-5" />
        </button>
        {savedAt && <span className="text-xs text-emerald-600 ml-2">Autosaved @ {savedAt}</span>}
        <button
          onClick={() => setShowKeys(true)}
          className="ml-auto mr-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white"
        >
          <KeyRound className="w-3.5 h-3.5" /> Answer Keys
        </button>
      </div>

      {/* split pane */}
      <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
        {/* passage */}
        <div className="overflow-y-auto pr-2 pt-4">
          <h2 className="text-2xl font-black">PASSAGE {passage.section}</h2>
          <p className="text-sm text-slate-500 mb-4">
            You should spend about 20 minutes on Questions {questions[0]?.number}–
            {questions[questions.length - 1]?.number}, which are based on Reading Passage {passage.section}.
          </p>
          <h3 className="text-xl font-bold text-center mb-3">{passage.title}</h3>
          {passage.subtitle && (
            <p className="text-center italic font-semibold mb-4">{passage.subtitle}</p>
          )}
          <div className="space-y-4 leading-relaxed">
            {paragraphs.map((p, i) => {
              const m = p.match(/^([A-H])\n([\s\S]*)$/); // lettered section
              return (
                <div key={i}>
                  {m ? (
                    <>
                      <div className="font-black mb-1">{m[1]}</div>
                      <p className={guided ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}>{m[2]}</p>
                    </>
                  ) : (
                    <p className={guided ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}>{p}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* questions */}
        <div className="overflow-y-auto pl-2 pt-4 border-l border-slate-200 dark:border-neutral-800">
          {groups.map((g, gi) => (
            <div key={gi} className="mb-7">
              <h4 className="font-bold mb-1">
                Questions {g.items[0].number}
                {g.items.length > 1 ? `–${g.items[g.items.length - 1].number}` : ""}
              </h4>
              {g.instruction && <p className="text-sm mb-3">{g.instruction}</p>}

              {/* the heading/matching option box, printed once per group */}
              {(g.items[0].question_type === "heading" || g.items[0].question_type === "matching") &&
                g.items[0].options && (
                  <div className="border border-slate-300 dark:border-neutral-700 rounded-lg p-3 mb-4 text-sm space-y-1">
                    {g.items[0].options.map((o, i) => (
                      <div key={i}>
                        <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                        {o}
                      </div>
                    ))}
                  </div>
                )}

              <div className="space-y-4">
                {g.items.map((q) => (
                  <QuestionRow
                    key={q.id}
                    q={q}
                    value={answers[q.number] || ""}
                    onChange={(v) => setAnswer(q.number, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* answer keys drawer */}
      {showKeys && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-full max-w-md h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black">Answer Keys</h3>
                <p className="text-xs text-slate-500">Review completed answers</p>
              </div>
              <button onClick={() => setShowKeys(false)} className="p-1 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-900 text-white">
                <span className="font-bold text-sm">Band Score</span>
                <span className="text-xl font-black" style={{ color: bandColor(band) }}>
                  {formatBand(band)}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {raw}/{questions.length} correct
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showUnanswered} onChange={(e) => setShowUnanswered(e.target.checked)} />
                Show answers for unanswered
              </label>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-neutral-900">
                  <tr className="text-left text-slate-500">
                    <th className="py-2 px-4 font-semibold">Question</th>
                    <th className="py-2 px-2 font-semibold">My Answer</th>
                    <th className="py-2 px-2 font-semibold">Correct Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const mine = answers[q.number] || "";
                    const ok = isCorrect(mine, q.correct_answer);
                    const bg = !mine
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : ok
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-red-50 dark:bg-red-900/20";
                    return (
                      <tr key={q.id} className={bg}>
                        <td className="py-2 px-4 font-semibold">{q.number}</td>
                        <td className="py-2 px-2">{mine || "–"}</td>
                        <td className="py-2 px-2">
                          {mine || showUnanswered ? q.correct_answer : <span className="opacity-30">•••</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => {
                  setShowKeys(false);
                  onFinished?.(raw, band);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setShowKeys(false)} />
        </div>
      )}
    </div>
  );
}

/** Renders one question in whichever official format it uses. Shared with Listening. */
export function QuestionRow({
  q,
  value,
  onChange,
}: {
  q: ExamQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const choices =
    q.question_type === "tfng" ? TFNG : q.question_type === "ynng" ? YNNG : q.options ?? [];

  if (q.question_type === "mcq" || q.question_type === "tfng" || q.question_type === "ynng") {
    return (
      <div>
        <p className="mb-1.5">
          <span className="font-bold mr-2">{q.number}</span>
          {q.question_text}
        </p>
        <div className="space-y-1.5 pl-6">
          {choices.map((opt, i) => {
            const letter = q.question_type === "mcq" ? String.fromCharCode(65 + i) : opt;
            const selected = value === letter;
            return (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`q-${q.number}`}
                  checked={selected}
                  onChange={() => onChange(letter)}
                  className="mt-1"
                />
                <span>
                  {q.question_type === "mcq" && <span className="font-semibold mr-1.5">{letter}.</span>}
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // heading / matching → a letter dropdown, like the real paper's boxes
  if (q.question_type === "heading" || q.question_type === "matching") {
    return (
      <div className="flex items-start gap-3">
        <span className="font-bold">{q.number}</span>
        <span className="flex-1">{q.question_text}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-slate-300 dark:border-neutral-700 rounded-lg px-2 py-1 bg-transparent"
        >
          <option value="">{q.number}</option>
          {(q.options ?? []).map((_, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <option key={letter} value={letter}>
                {letter}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  // Completion (notes / summary / sentence). The box goes exactly where the gap is
  // printed, the way the paper reads — parking it in a right-hand column made the
  // learner match numbers back to the sentence themselves.
  const [before, ...rest] = q.question_text.split(GAP_MARK);
  const after = rest.join(GAP_MARK);
  const box = (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="inline-block align-baseline mx-1 w-36 border-b-2 border-slate-400 dark:border-neutral-600 focus:border-emerald-500 outline-none bg-transparent px-1 py-0.5 text-center"
      placeholder={String(q.number)}
      aria-label={`Question ${q.number}`}
    />
  );

  return (
    <div className="flex items-start gap-2 leading-8">
      <span className="font-bold shrink-0 pt-0.5">{q.number}</span>
      <span className="flex-1">
        {before}
        {rest.length ? box : null}
        {after}
        {/* A gap that the parser could not place inline still needs a box. */}
        {rest.length === 0 && box}
      </span>
    </div>
  );
}
