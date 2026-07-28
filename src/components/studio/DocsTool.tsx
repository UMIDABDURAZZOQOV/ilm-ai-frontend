"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, Trash2, Link2, Plus } from "lucide-react";
import { listDocuments, deleteDocument, importUrl, type StudyDocument } from "@/lib/studioApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

export default function DocsTool({ lang, userId }: { lang: string; userId: number }) {
  const [docs, setDocs] = useState<StudyDocument[] | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState("");

  function load() {
    listDocuments(userId).then((d) => setDocs(d.documents)).catch(() => setDocs([]));
  }

  useEffect(load, [userId]);

  async function addUrl() {
    if (!url.trim() || importing) return;
    setImporting(true);
    setImportErr("");
    try {
      await importUrl(userId, url.trim());
      setUrl("");
      load();
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setImportErr(err?.detail === "fetch_failed" ? "fetch" : err?.detail === "no_text_found" ? "notext" : err?.status === 403 ? "limit" : "failed");
    } finally {
      setImporting(false);
    }
  }

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

      {/* Add material from a web link */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 mb-4">
        <p className="text-xs font-bold text-neutral-500 mb-2 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> {tr(lang, "Havoladan qo'shish", "Добавить по ссылке", "Add from a link")}
        </p>
        <div className="flex items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder={tr(lang, "Maqola yoki veb-sahifa havolasi", "Ссылка на статью", "Article or web page URL")}
            className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
          <button onClick={addUrl} disabled={importing || !url.trim()} className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        {importErr && (
          <p className="text-xs text-red-500 mt-2">
            {importErr === "fetch" ? tr(lang, "Havolani ochib bo'lmadi.", "Не удалось открыть ссылку.", "Couldn't fetch the link.")
              : importErr === "notext" ? tr(lang, "Sahifada matn topilmadi.", "На странице нет текста.", "No text found on the page.")
              : importErr === "limit" ? tr(lang, "Yuklash limitiga yetdingiz.", "Достигнут лимит.", "Upload limit reached.")
              : tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось.", "Couldn't add it.")}
          </p>
        )}
      </div>

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
