"use client";

import { useRef, useState } from "react";
import { NotebookPen, Loader2, RotateCcw, Check } from "lucide-react";
import { notesToLibrary } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function NotesTool({ lang, userId }: { lang: string; userId: number }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ filename: string; text: string } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);
    setError("");
    setBlob(f);
    setPreview(URL.createObjectURL(f));
  }

  async function add() {
    if (!blob || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await notesToLibrary(userId, blob);
      setResult({ filename: r.filename, text: r.text });
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_text_found" ? "no_text" : err?.status === 403 ? "limit" : "failed");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setBlob(null);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Qo'lyozma → kutubxona", "Заметки → библиотека", "Notes → library")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(
          lang,
          "Qo'lda yozgan daftaringizni suratga oling — AI o'qib, materiallaringizga qo'shadi. Keyin companion shundan javob beradi.",
          "Сфотографируйте рукописные заметки — ИИ прочитает и добавит их в материалы.",
          "Photograph handwritten notes — the AI reads them and adds them to your materials, so the companion can use them."
        )}
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
          className="w-full grid place-items-center gap-2 py-10 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-emerald-400 mb-3"
        >
          <NotebookPen className="w-8 h-8" />
          <span className="text-sm font-bold">{tr(lang, "Daftar sahifasini tanlash", "Выбрать страницу", "Choose a page")}</span>
        </button>
      )}

      {preview && !result && (
        <button onClick={add} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <NotebookPen className="w-4 h-4" />}
          {busy ? tr(lang, "Qo'shilyapti...", "Добавляется...", "Adding...") : tr(lang, "Kutubxonaga qo'shish", "Добавить в библиотеку", "Add to library")}
        </button>
      )}

      {error === "no_text" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Matn topilmadi — aniqroq rasm bilan urinib ko'ring.", "Текст не найден — попробуйте чётче.", "No text found — try a clearer photo.")}</p>}
      {error === "limit" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Yuklash limitiga yetdingiz.", "Достигнут лимит загрузок.", "You've reached your upload limit.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't add it — try again.")}</p>}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-bold">
            <Check className="w-3.5 h-3.5" /> {tr(lang, "Qo'shildi", "Добавлено", "Added")}: {result.filename}
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-xs font-bold text-neutral-400 mb-1">{tr(lang, "O'qilgan matn", "Распознанный текст", "Transcribed text")}</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">{result.text}</p>
          </div>
          <button onClick={reset} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> {tr(lang, "Yana bittasi", "Ещё одна", "Add another")}
          </button>
        </div>
      )}
    </div>
  );
}
