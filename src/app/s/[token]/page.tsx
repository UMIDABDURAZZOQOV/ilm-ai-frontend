"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, BookOpen } from "lucide-react";
import { getShare } from "@/lib/shareApi";
import Mermaid from "@/components/ui/Mermaid";
import { MarkdownText } from "@/components/MarkdownText";
import { useI18n } from "@/hooks/useI18n";

type Share = { kind: string; title: string; payload: any };

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { lang } = useI18n();
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
  const [data, setData] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getShare(token).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-violet-500" />
          <span className="font-extrabold text-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Ilm AI</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
        ) : !data ? (
          <div className="text-center py-20">
            <p className="text-sm text-neutral-500">{tr("Bu havola topilmadi yoki muddati o'tgan.", "Ссылка не найдена или устарела.", "This link was not found or has expired.")}</p>
          </div>
        ) : (
          <div>
            {data.title && <h1 className="text-2xl font-extrabold mb-4">{data.title}</h1>}

            {data.kind === "diagram" && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white">
                <Mermaid code={data.payload.mermaid || ""} />
              </div>
            )}

            {data.kind === "cheatsheet" && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 prose-sm max-w-none">
                <MarkdownText>{data.payload.markdown || ""}</MarkdownText>
              </div>
            )}

            {data.kind === "flashcards" && (
              <div className="space-y-2">
                {(data.payload.flashcards || []).map((c: { front: string; back: string }, i: number) => (
                  <button
                    key={i}
                    onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    className="w-full text-left p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    <p className="font-bold text-sm">{c.front}</p>
                    {flipped[i] ? <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{c.back}</p> : <p className="text-xs text-neutral-400 mt-1">{tr("Javobni ko'rish uchun bosing", "Нажмите, чтобы увидеть ответ", "Tap to reveal the answer")}</p>}
                  </button>
                ))}
              </div>
            )}

            {data.kind === "course" && (
              <div className="space-y-5">
                {(data.payload.chapters || []).map((ch: { title: string; lessons: { title: string; summary: string }[] }, ci: number) => (
                  <div key={ci}>
                    <h3 className="font-extrabold text-sm mb-2 flex items-center gap-2">
                      <span className="grid place-items-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 text-xs font-black">{ci + 1}</span>
                      {ch.title}
                    </h3>
                    <div className="space-y-2 pl-3 border-l-2 border-neutral-200 dark:border-neutral-800 ml-3">
                      {(ch.lessons || []).map((ls, li) => (
                        <div key={li} className="flex items-start gap-2 p-3 ml-2 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                          <BookOpen className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-sm">{ls.title}</p>
                            <p className="text-xs text-neutral-500">{ls.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white text-center">
              <p className="font-bold mb-1">{tr("O'z materialingizdan shunday narsalar yasang", "Создавайте такое из своих материалов", "Make things like this from your own materials")}</p>
              <p className="text-sm text-white/80 mb-3">{tr("Ilm AI — sizni biladigan shaxsiy AI repetitor.", "Ilm AI — персональный ИИ-репетитор, который вас знает.", "Ilm AI — a personal AI tutor that knows you.")}</p>
              <Link href="/signup" className="inline-block px-5 py-2.5 rounded-xl bg-white text-violet-700 font-bold text-sm">{tr("Ilm AI'ni sinab ko'ring", "Попробуйте Ilm AI", "Try Ilm AI")}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
