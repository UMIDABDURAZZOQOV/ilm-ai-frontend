"use client";

import { useState } from "react";
import { Network, Loader2, Sparkles } from "lucide-react";
import { generateDiagram } from "@/lib/studioApi";
import Mermaid from "@/components/ui/Mermaid";
import ShareButton from "@/components/ui/ShareButton";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function DiagramTool({ lang, userId }: { lang: string; userId: number }) {
  const [topic, setTopic] = useState("");
  const [fromMaterials, setFromMaterials] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title: string; mermaid: string } | null>(null);
  const [error, setError] = useState("");

  async function build() {
    if (busy) return;
    if (!fromMaterials && !topic.trim()) return;
    setBusy(true);
    setError("");
    try {
      const r = await generateDiagram({ userId, topic, fromMaterials, language: lang });
      setResult(r);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" ? "no_materials" : err?.detail === "empty" ? "empty" : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "AI diagramma", "AI-диаграмма", "AI diagram")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Mavzu yoki materialdan vizual sxema/mind-map yasang — tushunchalar qanday bog'langanini ko'ring.", "Постройте визуальную схему/майнд-мэп по теме или материалу.", "Build a visual mind-map from a topic or your materials — see how ideas connect.")}
      </p>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && build()}
        placeholder={tr(lang, "Mavzu (masalan: Fotosintez)", "Тема (например: Фотосинтез)", "Topic (e.g. Photosynthesis)")}
        disabled={fromMaterials}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm mb-3 disabled:opacity-50"
      />

      <label className="flex items-center gap-2 mb-4 text-sm text-neutral-600 dark:text-neutral-300">
        <input type="checkbox" checked={fromMaterials} onChange={(e) => setFromMaterials(e.target.checked)} className="rounded" />
        {tr(lang, "Yuklagan materialimdan yasa", "На основе моих материалов", "Base it on my materials")}
      </label>

      <button onClick={build} disabled={busy || (!fromMaterials && !topic.trim())} className="w-full py-3 rounded-2xl font-bold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? tr(lang, "Chizilyapti...", "Строится...", "Building...") : tr(lang, "Diagramma yasash", "Создать диаграмму", "Build diagram")}
      </button>

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "empty" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Mavzu kiriting.", "Введите тему.", "Enter a topic.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}

      {result && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            {result.title ? <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Network className="w-4 h-4 text-sky-500" /> {result.title}</h3> : <span />}
            <ShareButton userId={userId} kind="diagram" title={result.title} payload={{ mermaid: result.mermaid }} lang={lang} />
          </div>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white">
            <Mermaid code={result.mermaid} />
          </div>
        </div>
      )}
    </div>
  );
}
