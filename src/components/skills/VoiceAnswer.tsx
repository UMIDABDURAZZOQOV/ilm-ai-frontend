"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Check, RotateCcw } from "lucide-react";
import { voiceCheckAnswer, type VoiceCheckResult } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

/**
 * Spoken-answer check for the content subjects (history, biology, ...). Instead
 * of just tapping the right option, the learner explains the answer out loud in
 * Uzbek; the recording goes to Gemini which transcribes it and judges whether
 * they genuinely understand — saying it in your own words proves it better than
 * a multiple-choice tap. On-demand only, so the mic (and the API call) fire just
 * when the learner chooses to speak.
 */
export default function VoiceAnswer({
  lang,
  questionText,
  correctAnswer,
}: {
  lang: string;
  questionText: string;
  correctAnswer: string;
}) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VoiceCheckResult | null>(null);
  const [error, setError] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRec() {
    setError(false);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 800) return; // too short to be real speech
        setBusy(true);
        try {
          const r = await voiceCheckAnswer({ questionText, correctAnswer, lang, audio: blob });
          setResult(r);
        } catch {
          setError(true);
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError(true);
    }
  }

  function stopRec() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-600 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 hover:bg-teal-200 dark:hover:bg-teal-900"
      >
        <Mic className="w-3.5 h-3.5" />
        {tr(lang, "🎤 Ovozli javob bering", "🎤 Ответьте голосом", "🎤 Answer out loud")}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 p-3"
    >
      <p className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-2">
        {tr(
          lang,
          "Javobni o'z so'zlaringiz bilan tushuntiring — AI tushunganingizni tekshiradi.",
          "Объясните ответ своими словами — ИИ проверит понимание.",
          "Explain the answer in your own words — the AI checks your understanding."
        )}
      </p>

      <div className="flex justify-center py-1">
        {busy ? (
          <div className="h-14 w-14 rounded-full grid place-items-center bg-white dark:bg-neutral-900">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
          </div>
        ) : recording ? (
          <button
            onClick={stopRec}
            className="h-14 w-14 rounded-full grid place-items-center bg-red-500 text-white animate-pulse"
            aria-label={tr(lang, "To'xtatish", "Остановить", "Stop")}
          >
            <Square className="w-5 h-5" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={startRec}
            className="h-14 w-14 rounded-full grid place-items-center bg-teal-500 text-white hover:bg-teal-600"
            aria-label={tr(lang, "Yozishni boshlash", "Начать запись", "Start recording")}
          >
            {result ? <RotateCcw className="w-5 h-5" /> : <Mic className="w-6 h-6" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1.5">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                result.understood
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
              }`}
            >
              {result.understood ? <Check className="w-3.5 h-3.5" /> : null}
              {result.understood
                ? tr(lang, "Tushundingiz!", "Понятно!", "You've got it!")
                : tr(lang, "Deyarli — yana bir bor", "Почти — ещё раз", "Almost — try again")}
            </div>
            {result.transcript && (
              <p className="text-xs italic text-neutral-500 dark:text-neutral-400">
                “{result.transcript}”
              </p>
            )}
            {result.feedback && (
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                {result.feedback}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          {tr(lang, "Bo'lmadi — mikrofonga ruxsat bering va qayta urinib ko'ring", "Не удалось — разрешите микрофон и попробуйте снова", "Couldn't record — allow the mic and try again")}
        </p>
      )}
    </motion.div>
  );
}
