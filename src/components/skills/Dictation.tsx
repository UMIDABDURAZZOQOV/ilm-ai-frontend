"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Volume2, Check, X } from "lucide-react";
import { getPronunciationPhrases, type PronunciationPhrase } from "@/lib/skillTreeApi";

/**
 * Dictation for the language subjects: a phrase is spoken (browser TTS), the learner
 * types what they heard, and it is checked against the target. Trains listening and
 * spelling together — the pair text practice leaves out. Reuses the pronunciation
 * phrase bank; the comparison is normalised (case, punctuation, spacing) so a right
 * answer with a stray comma still counts.
 */
const norm = (s: string) =>
  s.toLowerCase().replace(/[.,!?;:'"()¿¡]/g, "").replace(/\s+/g, " ").trim();

export default function Dictation({
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
  const [phrases, setPhrases] = useState<PronunciationPhrase[] | null>(null);
  const [language, setLanguage] = useState("");
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getPronunciationPhrases(userId, subjectSlug)
      .then((d) => { setPhrases(d.phrases); setLanguage(d.language); })
      .catch(() => setError("Iboralarni yuklab bo'lmadi."));
  }, [userId, subjectSlug]);

  const phrase = phrases?.[index];
  const isCorrect = phrase ? norm(typed) === norm(phrase.text) : false;

  const play = () => {
    if (!phrase || typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(phrase.text);
    u.lang = language === "Korean" ? "ko-KR" : language === "French" ? "fr-FR" : "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  // Auto-play the first phrase once loaded, and each new one.
  useEffect(() => { if (phrase) play(); /* eslint-disable-next-line */ }, [phrase]);

  const check = () => {
    if (checked || !phrase) return;
    setChecked(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    setChecked(false);
    setTyped("");
    setIndex((i) => (phrases ? (i + 1) % phrases.length : 0));
  };

  const done = phrases && index === phrases.length - 1 && checked;

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>
      <h2 className="text-lg font-extrabold mb-1">Diktant · {subjectName}</h2>
      <p className="text-sm text-neutral-500 mb-6">Eshiting va eshitganingizni yozing.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!phrases && !error && <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {phrases && phrases.length === 0 && <p className="text-sm text-neutral-500">Hozircha ibora yo'q.</p>}

      {phrase && (
        <div className="rounded-3xl border-2 border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex justify-center mb-5">
            <button onClick={play} className="h-16 w-16 rounded-full grid place-items-center bg-sky-500 text-white hover:bg-sky-600" title="Yana eshitish">
              <Volume2 className="w-7 h-7" />
            </button>
          </div>

          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (checked ? next() : check())}
            disabled={checked}
            autoFocus
            placeholder="Eshitganingizni yozing…"
            className={`w-full rounded-xl border-2 px-4 py-3 text-[15px] bg-transparent ${
              checked ? (isCorrect ? "border-emerald-400" : "border-red-400") : "border-neutral-300 dark:border-neutral-700"
            }`}
          />

          {checked && (
            <div className="mt-3">
              <div className={`flex items-center gap-2 text-sm font-bold ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                {isCorrect ? <><Check className="w-4 h-4" /> To'g'ri!</> : <><X className="w-4 h-4" /> To'g'ri javob:</>}
              </div>
              {!isCorrect && <p className="text-[15px] font-semibold mt-1">{phrase.text}</p>}
              <p className="text-xs text-neutral-500 mt-1">{phrase.uz}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-5">
            <span className="text-xs text-neutral-400">{index + 1} / {phrases?.length}</span>
            {!checked ? (
              <button onClick={check} disabled={!typed.trim()} className="text-sm font-bold px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-50">
                Tekshirish
              </button>
            ) : (
              <button onClick={next} className="text-sm font-bold px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                Keyingisi →
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <p className="text-center text-sm font-bold mt-4 text-neutral-500">{correctCount} / {phrases!.length} to'g'ri yozildi</p>
      )}
    </div>
  );
}
