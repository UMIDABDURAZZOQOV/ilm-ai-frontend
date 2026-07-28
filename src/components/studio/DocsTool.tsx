"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { listDocuments, deleteDocument, type StudyDocument } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function DocsTool({ lang, userId }: { lang: string; userId: number }) {
  const [docs, setDocs] = useState<StudyDocument[] | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    listDocuments(userId).then((d) => setDocs(d.documents)).catch(() => setDocs([]));
  }

  useEffect(load, [userId]);

  async function remove(filename: string) {
    if (deleting) return;
    if (!window.confirm(tr(lang, `"${filename}" o'chirilsinmi?`, `Удалить "${filename}"?`, `Delete "${filename}"?`))) return;
    setDeleting(filename);
    try {
      await deleteDocument(userId, filename);
      setDocs((prev) => (prev ? prev.filter((d) => d.filename !== filename) : prev));
    } catch {
      /* leave list as-is */
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Materiallarim", "Мои материалы", "My materials")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Yuklagan hujjatlaringiz. Keraksizini o'chiring — companion faqat qolganidan foydalanadi.", "Ваши документы. Удалите ненужные.", "Your uploaded documents. Delete what you don't need.")}
      </p>

      {docs === null ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-neutral-500 py-8 text-center">{tr(lang, "Hali hujjat yo'q.", "Пока нет документов.", "No documents yet.")}</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.filename} className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="w-9 h-9 rounded-xl grid place-items-center bg-neutral-100 dark:bg-neutral-800 shrink-0">
                <FileText className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{d.filename}</p>
                <p className="text-xs text-neutral-500">{d.topic} · {d.chunks} {tr(lang, "bo'lak", "фрагм.", "chunks")}</p>
              </div>
              <button
                onClick={() => remove(d.filename)}
                disabled={deleting === d.filename}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                aria-label={tr(lang, "O'chirish", "Удалить", "Delete")}
              >
                {deleting === d.filename ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
