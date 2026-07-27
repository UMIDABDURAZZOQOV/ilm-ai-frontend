"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2, Check, X, RotateCcw } from "lucide-react";
import { photoCheckAnswer, type PhotoCheckResult } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

/**
 * Snap or upload a photo of a handwritten answer to any subject; Gemini reads the
 * handwriting and evaluates it (right/wrong, what's missing, how to improve). The
 * question is optional — with it the answer is graded against it, without it the
 * writing is assessed on its own. Distinct from the math solver, which solves the
 * problem rather than reading and grading what the learner wrote.
 */
export default function PhotoAnswer({ lang, onBack }: { lang: string; onBack: () => void }) {
  const [question, setQuestion] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PhotoCheckResult | null>(null);
  const [error, setError] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);
    setError(false);
    setBlob(f);
    setPreview(URL.createObjectURL(f));
  }

  async function check() {
    if (!blob || busy) return;
    setBusy(true);
    setError(false);
    try {
      const r = await photoCheckAnswer({ questionText: question, lang, image: blob });
      setResult(r);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setBlob(null);
    setResult(null);
    setError(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        {tr(lang, "Orqaga", "Назад", "Back")}
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Camera className="w-6 h-6 text-rose-500" />
        <h2 className="text-lg font-extrabold">
          {tr(lang, "Rasm orqali javob", "Ответ по фото", "Photo answer")}
        </h2>
      </div>
      <p className="text-sm text-neutral-500 mb-5">
        {tr(
          lang,
          "Qo'lda yozgan javobingizni suratga oling — AI o'qib, tekshirib beradi.",
          "Сфотографируйте рукописный ответ — ИИ прочитает и проверит.",
          "Photograph your handwritten answer — the AI reads and checks it."
        )}
      </p>

      {/* Optional question */}
      <label className="block text-xs font-bold text-neutral-500 mb-1">
        {tr(lang, "Savol (ixtiyoriy)", "Вопрос (необязательно)", "Question (optional)")}
      </label>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        placeholder={tr(lang, "Qaysi savolga javob berayapsiz?", "На какой вопрос отвечаете?", "Which question are you answering?")}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm mb-4 resize-none"
      />

      {/* Photo picker / preview */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
      {preview ? (
        <div className="relative mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full max-h-72 object-contain rounded-2xl border border-neutral-200 dark:border-neutral-800" />
          <button
            onClick={reset}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
            aria-label={tr(lang, "Boshqa rasm", "Другое фото", "Different photo")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full grid place-items-center gap-2 py-10 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-rose-400 mb-4"
        >
          <Camera className="w-8 h-8" />
          <span className="text-sm font-bold">{tr(lang, "Rasm tanlash yoki suratga olish", "Выбрать или снять фото", "Choose or take a photo")}</span>
        </button>
      )}

      {preview && !result && (
        <button
          onClick={check}
          disabled={busy}
          className="w-full py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {busy ? tr(lang, "Tekshirilyapti...", "Проверка...", "Checking...") : tr(lang, "Tekshirish", "Проверить", "Check")}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-3">
          {tr(lang, "Bo'lmadi — aniqroq rasm bilan qayta urinib ko'ring", "Не удалось — попробуйте более чёткое фото", "Couldn't read it — try a clearer photo")}
        </p>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-full grid place-items-center text-white shrink-0"
              style={{ backgroundColor: result.correct ? "#16a34a" : "#f59e0b" }}
            >
              {result.correct ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-sm">
                {result.correct
                  ? tr(lang, "To'g'ri javob!", "Верный ответ!", "Correct!")
                  : tr(lang, "To'liq emas", "Не совсем", "Not quite")}
              </p>
              {result.score !== null && (
                <p className="text-xs font-bold" style={{ color: scoreColor(result.score) }}>
                  {result.score} / 100
                </p>
              )}
            </div>
          </div>

          {result.transcript && (
            <div>
              <p className="text-xs font-bold text-neutral-400 mb-0.5">{tr(lang, "AI o'qigani", "ИИ прочитал", "The AI read")}</p>
              <p className="text-sm italic text-neutral-500 dark:text-neutral-400 whitespace-pre-line">“{result.transcript}”</p>
            </div>
          )}
          {result.feedback && (
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 whitespace-pre-line">{result.feedback}</p>
          )}

          <button onClick={reset} className="text-sm font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> {tr(lang, "Yana bittasini tekshirish", "Проверить ещё", "Check another")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
