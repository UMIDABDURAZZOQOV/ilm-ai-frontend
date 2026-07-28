"use client";

import { useState } from "react";
import { Languages, Loader2, Printer } from "lucide-react";
import { translateExplain } from "@/lib/studioApi";
import { MarkdownText } from "@/components/MarkdownText";
import { printMarkdown } from "@/lib/printDoc";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function TranslateTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function build() {
    setBusy(true);
    setError("");
    try {
      const r = await translateExplain(userId, lang);
      setMd(r.markdown);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Tarjima + tushuntirish", "Перевод + объяснение", "Translate & explain")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Chet tilidagi materialingizni tarjima qilib, sodda tushuntiramiz.", "Переведём и просто объясним материал на другом языке.", "We translate your foreign-language material and explain it simply.")}
      </p>

      {!md ? (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
          {busy ? tr(lang, "Tarjima qilinyapti...", "Переводится...", "Translating...") : tr(lang, "Tarjima qilish", "Перевести", "Translate")}
        </button>
      ) : (
        <div>
          <div className="flex justify-end mb-2">
            <button onClick={() => printMarkdown(tr(lang, "Tarjima", "Перевод", "Translation"), md)} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600">
              <Printer className="w-3.5 h-3.5" /> {tr(lang, "PDF saqlash", "Сохранить PDF", "Save PDF")}
            </button>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 prose-sm max-w-none">
            <MarkdownText>{md}</MarkdownText>
          </div>
          <button onClick={build} disabled={busy} className="mt-3 text-sm font-bold text-indigo-500 hover:text-indigo-600 disabled:opacity-50">
            {tr(lang, "Qayta yaratish", "Пересоздать", "Rebuild")}
          </button>
        </div>
      )}

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't do it — try again.")}</p>}
    </div>
  );
}
