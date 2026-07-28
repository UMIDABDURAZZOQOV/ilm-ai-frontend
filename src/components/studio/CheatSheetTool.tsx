"use client";

import { useState } from "react";
import { ScrollText, Loader2, Copy, Check } from "lucide-react";
import { cheatSheet } from "@/lib/studioApi";
import { MarkdownText } from "@/components/MarkdownText";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function CheatSheetTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function build() {
    setBusy(true);
    setError("");
    try {
      const r = await cheatSheet(userId, lang);
      setMd(r.markdown);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!md) return;
    navigator.clipboard?.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Bir sahifa shpargalka", "Шпаргалка на страницу", "One-page cheat sheet")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Materialingizdagi eng muhim faktlar bir sahifada.", "Ключевые факты материала на одной странице.", "The highest-yield facts from your material on one page.")}
      </p>

      {!md ? (
        <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
          {busy ? tr(lang, "Yasalyapti...", "Создаётся...", "Building...") : tr(lang, "Shpargalka yaratish", "Создать шпаргалку", "Build cheat sheet")}
        </button>
      ) : (
        <div>
          <div className="flex justify-end mb-2">
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? tr(lang, "Nusxalandi", "Скопировано", "Copied") : tr(lang, "Nusxalash", "Копировать", "Copy")}
            </button>
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 prose-sm max-w-none">
            <MarkdownText>{md}</MarkdownText>
          </div>
          <button onClick={build} disabled={busy} className="mt-3 text-sm font-bold text-amber-600 hover:text-amber-700 disabled:opacity-50">
            {tr(lang, "Qayta yaratish", "Пересоздать", "Rebuild")}
          </button>
        </div>
      )}

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
    </div>
  );
}
