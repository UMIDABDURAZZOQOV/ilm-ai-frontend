"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, RotateCcw, ChevronRight } from "lucide-react";
import { photoKit, type PhotoKit } from "@/lib/studioApi";
import PracticeSession from "@/components/skills/PracticeSession";
import type { PracticeResultItem } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function PhotoKitTool({ lang, userId }: { lang: string; userId: number }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [kit, setKit] = useState<PhotoKit | null>(null);
  const [error, setError] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [quizOn, setQuizOn] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setKit(null);
    setError(false);
    setBlob(f);
    setPreview(URL.createObjectURL(f));
  }

  async function build() {
    if (!blob || busy) return;
    setBusy(true);
    setError(false);
    try {
      const k = await photoKit(userId, lang, blob);
      setKit(k);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setBlob(null);
    setKit(null);
    setError(false);
    setFlipped({});
    if (fileRef.current) fileRef.current.value = "";
  }

  if (quizOn && kit) {
    return (
      <PracticeSession
        lang={lang}
        title={tr(lang, "Viktorina", "Тест", "Quiz")}
        accent="#F43F5E"
        questions={kit.quiz}
        onFinish={async (results: PracticeResultItem[]) => {
          const correct = results.filter((r) => r.is_correct).length;
          return { xp_awarded: correct * 5 };
        }}
        onExit={() => setQuizOn(false)}
      />
    );
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Rasmdan to'plam", "Набор из фото", "Photo study kit")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Darslik/daftar sahifasini suratga oling — konspekt, flashcard va viktorina yasaymiz.", "Сфотографируйте страницу — сделаем конспект, карточки и тест.", "Snap a page — we'll make a summary, flashcards and a quiz.")}
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />

      {preview ? (
        <div className="relative mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full max-h-60 object-contain rounded-2xl border border-neutral-200 dark:border-neutral-800" />
          <button onClick={reset} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full grid place-items-center gap-2 py-10 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-rose-400 mb-3"
        >
          <Camera className="w-8 h-8" />
          <span className="text-sm font-bold">{tr(lang, "Rasm tanlash", "Выбрать фото", "Choose a photo")}</span>
        </button>
      )}

      {preview && !kit && (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {busy ? tr(lang, "Yasalyapti...", "Создаётся...", "Building...") : tr(lang, "To'plam yasash", "Создать набор", "Build kit")}
        </button>
      )}

      {error && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — aniqroq rasm bilan urinib ko'ring.", "Не удалось — попробуйте чётче.", "Couldn't read it — try a clearer photo.")}</p>}

      {kit && (
        <div className="mt-4 space-y-5">
          {kit.summary && (
            <div>
              <h3 className="font-extrabold text-sm mb-1">{kit.title || tr(lang, "Konspekt", "Конспект", "Summary")}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-line">{kit.summary}</p>
            </div>
          )}

          {kit.flashcards.length > 0 && (
            <div>
              <h3 className="font-extrabold text-sm mb-2">{tr(lang, "Flashcardlar", "Карточки", "Flashcards")} ({kit.flashcards.length})</h3>
              <div className="space-y-2">
                {kit.flashcards.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    className="w-full text-left p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-300"
                  >
                    <p className="font-bold text-sm">{c.front}</p>
                    {flipped[i] ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{c.back}</p>
                    ) : (
                      <p className="text-xs text-neutral-400 mt-1">{tr(lang, "Javobni ko'rish uchun bosing", "Нажмите, чтобы увидеть ответ", "Tap to reveal")}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {kit.quiz.length > 0 && (
            <button onClick={() => setQuizOn(true)} className="w-full py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2">
              {tr(lang, "Viktorinani boshlash", "Начать тест", "Start quiz")} ({kit.quiz.length}) <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button onClick={reset} className="text-sm font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> {tr(lang, "Boshqa rasm", "Другое фото", "Another photo")}
          </button>
        </div>
      )}
    </div>
  );
}
