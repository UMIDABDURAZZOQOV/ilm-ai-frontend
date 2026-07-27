"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { getWrittenExam, gradeWrittenExam } from "@/lib/skillTreeApi";

/**
 * A subject essay exam: an open prompt the lesson quizzes can't ask, and AI grading of
 * the written answer on content, structure and language. Everything is in Uzbek.
 */
const scoreColor = (s: number) => (s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444");

function Criterion({ label, value }: { label: string; value: string }) {
  const n = Number(/(\d{1,3})/.exec(value)?.[1] ?? 0);
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-2.5">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="font-black" style={{ color: scoreColor(n) }}>{value}</div>
    </div>
  );
}

export default function WrittenExam({
  userId,
  subjectSlug,
  subjectName,
  onBack,
}: {
  userId: number;
  subjectSlug: string;
  subjectName: string;
  onBack: () => void;
}) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [minWords, setMinWords] = useState(150);
  const [essay, setEssay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof gradeWrittenExam>> | null>(null);

  useEffect(() => {
    getWrittenExam(userId, subjectSlug)
      .then((d) => { setPrompt(d.prompt); setMinWords(d.min_words || 150); })
      .catch(() => setError("Savolni yuklab bo'lmadi."));
  }, [userId, subjectSlug]);

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  const submit = async () => {
    if (!prompt || words < 10) return;
    setBusy(true);
    setError("");
    try {
      setResult(await gradeWrittenExam({ user_id: userId, subject: subjectSlug, prompt, essay_text: essay }));
    } catch {
      setError("Baholab bo'lmadi. Yana urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>
      <h2 className="text-lg font-extrabold mb-1">Yozma imtihon · {subjectName}</h2>
      <p className="text-sm text-neutral-500 mb-5">Savolga insho yozing — AI mazmun, tuzilish va tilni baholaydi.</p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {!prompt && !error && <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

      {prompt && (
        <>
          <div className="rounded-2xl border-2 border-neutral-900 dark:border-neutral-600 p-4 mb-4">
            <p className="font-bold whitespace-pre-line">{prompt}</p>
            <p className="text-xs text-neutral-500 mt-2">Kamida {minWords} so'z</p>
          </div>

          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Javobingizni shu yerga yozing…"
            disabled={!!result}
            className="w-full h-64 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-[15px] leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${words >= minWords ? "text-emerald-600" : "text-neutral-400"}`}>{words} so'z</span>
            {!result && (
              <button onClick={submit} disabled={busy || words < 10}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Topshirish
              </button>
            )}
          </div>

          {result && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-neutral-900 text-white">
                <span className="font-bold text-sm">Umumiy baho</span>
                <span className="text-2xl font-black" style={{ color: scoreColor(result.score) }}>{result.score}<span className="text-sm text-neutral-400">/100</span></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Criterion label="Mazmun" value={result.content} />
                <Criterion label="Tuzilish" value={result.structure} />
                <Criterion label="Til" value={result.language} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{result.feedback}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
