"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, KeyRound, X } from "lucide-react";
import { bandColor, formatBand, rawToBand } from "@/lib/ieltsBand";
import { QuestionRow, isCorrect, type ExamQuestion } from "./ReadingExam";

export interface ListeningSection {
  section: number;              // 1–4
  title: string;
  audio_url?: string | null;
  /** Set when the recording was ripped as several files; they play back to back. */
  audio_parts?: string[] | null;
  /** Speaker-tagged lines: "WOMAN: So, who runs the classes?" */
  transcript?: string | null;
}

/**
 * IELTS Listening: audio on top, collapsible audioscript underneath, questions
 * on the right — the same answer-key/band review as Reading.
 */
export default function ListeningExam({
  section,
  questions,
  storageKey,
  onFinished,
}: {
  section: ListeningSection;
  questions: ExamQuestion[];
  storageKey: string;
  onFinished?: (raw: number, band: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showScript, setShowScript] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const loaded = useRef(false);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // A part that was ripped in two plays as one continuous recording: starting any
  // track pauses the others, and finishing one starts the next.
  const tracks = useMemo(
    () => section.audio_parts?.length ? section.audio_parts : section.audio_url ? [section.audio_url] : [],
    [section.audio_parts, section.audio_url]
  );

  function stopOthers(index: number) {
    audioRefs.current.forEach((el, i) => {
      if (el && i !== index) el.pause();
    });
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      setSavedAt(new Date().toLocaleString());
    } catch {
      /* ignore */
    }
  }, [answers, storageKey]);

  const raw = useMemo(
    () => questions.reduce((n, q) => (isCorrect(answers[q.number] || "", q.correct_answer) ? n + 1 : n), 0),
    [answers, questions]
  );
  const band = rawToBand(Math.round((raw / Math.max(1, questions.length)) * 40), "listening");

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

  const scriptLines = useMemo(
    () => (section.transcript ? section.transcript.split(/\n+/).filter(Boolean) : []),
    [section.transcript]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-neutral-800">
        {savedAt && <span className="text-xs text-emerald-600">Autosaved @ {savedAt}</span>}
        <button
          onClick={() => setShowKeys(true)}
          className="ml-auto mr-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white"
        >
          <KeyRound className="w-3.5 h-3.5" /> Answer Keys
        </button>
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
        {/* audio + script */}
        <div className="overflow-y-auto pr-2 pt-4">
          <h2 className="text-lg font-black border-l-4 border-emerald-500 pl-2 mb-3">{section.title}</h2>

          {tracks.length ? (
            <div className="mb-4 space-y-2">
              {tracks.map((src, i) => (
                <div key={src}>
                  {tracks.length > 1 && (
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Recording {i + 1} of {tracks.length}
                    </div>
                  )}
                  <audio
                    controls
                    src={src}
                    ref={(el) => {
                      audioRefs.current[i] = el;
                    }}
                    onPlay={() => stopOthers(i)}
                    onEnded={() => audioRefs.current[i + 1]?.play()}
                    className="w-full"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-4 text-sm text-slate-500 mb-4">
              Audio will appear here once this section&apos;s recording is attached.
            </div>
          )}

          <button
            onClick={() => setShowScript((s) => !s)}
            className="w-full flex items-center justify-between py-2 border-t border-slate-200 dark:border-neutral-800 font-semibold text-sm"
          >
            Audioscript
            <ChevronUp className={`w-4 h-4 transition-transform ${showScript ? "" : "rotate-180"}`} />
          </button>

          {showScript && (
            <div className="border-l-4 border-emerald-500 pl-3 mt-2 space-y-2 text-sm leading-relaxed">
              {scriptLines.length ? (
                scriptLines.map((line, i) => {
                  const m = line.match(/^([A-Z][A-Z ]+):\s*([\s\S]*)$/);
                  return m ? (
                    <p key={i}>
                      <span className="font-black mr-1.5">{m[1]}:</span>
                      {m[2]}
                    </p>
                  ) : (
                    <p key={i}>{line}</p>
                  );
                })
              ) : (
                <p className="text-slate-500">Transcript not available for this section.</p>
              )}
            </div>
          )}
        </div>

        {/* questions */}
        <div className="overflow-y-auto pl-2 pt-4 border-l border-slate-200 dark:border-neutral-800">
          <p className="text-sm text-slate-500 mb-4">
            Questions {questions[0]?.number}–{questions[questions.length - 1]?.number}
          </p>
          {groups.map((g, gi) => (
            <div key={gi} className="mb-7">
              <h4 className="font-bold mb-1">
                Questions {g.items[0].number}
                {g.items.length > 1 ? `–${g.items[g.items.length - 1].number}` : ""}
              </h4>
              {g.instruction && <p className="text-sm mb-3">{g.instruction}</p>}
              <div className="space-y-4">
                {g.items.map((q) => (
                  <QuestionRow
                    key={q.id}
                    q={q}
                    value={answers[q.number] || ""}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.number]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
