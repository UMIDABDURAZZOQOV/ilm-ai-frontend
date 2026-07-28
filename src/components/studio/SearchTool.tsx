"use client";

import { useState } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { searchMaterials, type SearchHit } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function SearchTool({ lang, userId }: { lang: string; userId: number }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [noMaterials, setNoMaterials] = useState(false);

  async function run() {
    if (!query.trim() || busy) return;
    setBusy(true);
    setNoMaterials(false);
    try {
      const r = await searchMaterials(userId, query.trim());
      setHits(r.results);
      setNoMaterials(!!r.no_materials);
    } catch {
      setHits([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Daftaringizni qidirish", "Поиск по заметкам", "Search your notes")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Ma'no bo'yicha qidiring — aynan so'z bo'lishi shart emas. Materialingizdan mos parchalar chiqadi.", "Смысловой поиск по вашим материалам.", "Search by meaning — the most relevant passages from your materials appear.")}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={tr(lang, "Nimani qidiryapsiz?", "Что ищете?", "What are you looking for?")}
          className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm"
        />
        <button onClick={run} disabled={busy || !query.trim()} className="p-2.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {noMaterials && <p className="text-sm text-amber-600">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}

      {hits && !noMaterials && (
        hits.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">{tr(lang, "Mos parcha topilmadi.", "Ничего не найдено.", "No matching passages.")}</p>
        ) : (
          <div className="space-y-2">
            {hits.map((h, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3 h-3 text-neutral-400" />
                  <span className="text-[11px] font-semibold text-neutral-500">{h.filename}</span>
                  <span className="ml-auto text-[11px] font-bold text-cyan-500">{Math.round(h.score * 100)}%</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">{h.text}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
