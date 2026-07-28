"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Loader2, Camera, Headphones, Network, ScrollText, ClipboardList, Sparkles, Languages, NotebookPen, FolderOpen, Search, Mic } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import PhotoKitTool from "@/components/studio/PhotoKitTool";
import AudioRecapTool from "@/components/studio/AudioRecapTool";
import KnowledgeMapTool from "@/components/studio/KnowledgeMapTool";
import CheatSheetTool from "@/components/studio/CheatSheetTool";
import MockTool from "@/components/studio/MockTool";
import TranslateTool from "@/components/studio/TranslateTool";
import NotesTool from "@/components/studio/NotesTool";
import DocsTool from "@/components/studio/DocsTool";
import SearchTool from "@/components/studio/SearchTool";
import DiagramTool from "@/components/studio/DiagramTool";
import PodcastTool from "@/components/studio/PodcastTool";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

type Tool = "photo" | "audio" | "map" | "cheat" | "mock" | "translate" | "notes" | "docs" | "search" | "diagram" | "podcast";

export default function StudioPage() {
  const { user, isLoading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const tools: { id: Tool; icon: typeof Camera; color: string; title: string; sub: string }[] = [
    {
      id: "photo",
      icon: Camera,
      color: "#F43F5E",
      title: tr(lang, "Rasmdan to'plam", "Набор из фото", "Photo study kit"),
      sub: tr(lang, "Sahifa surati → konspekt + flashcard + viktorina", "Фото → конспект + карточки + тест", "Page photo → summary + flashcards + quiz"),
    },
    {
      id: "podcast",
      icon: Mic,
      color: "#D946EF",
      title: tr(lang, "AI podkast", "AI-подкаст", "AI podcast"),
      sub: tr(lang, "Ikki suhbatdosh ovozli podkast", "Подкаст с двумя ведущими", "Two-host audio podcast"),
    },
    {
      id: "audio",
      icon: Headphones,
      color: "#8B5CF6",
      title: tr(lang, "Eshitiladigan konspekt", "Аудио-конспект", "Audio recap"),
      sub: tr(lang, "Materialingiz ovozli qisqacha bayon", "Аудио-пересказ материала", "A spoken recap of your material"),
    },
    {
      id: "map",
      icon: Network,
      color: "#0EA5E9",
      title: tr(lang, "Bilim xaritasi", "Карта знаний", "Knowledge map"),
      sub: tr(lang, "Tushunchalar va bog'lanishlari", "Концепции и связи", "Concepts and how they connect"),
    },
    {
      id: "cheat",
      icon: ScrollText,
      color: "#F59E0B",
      title: tr(lang, "Bir sahifa shpargalka", "Шпаргалка на страницу", "One-page cheat sheet"),
      sub: tr(lang, "Eng muhim faktlar bir sahifada", "Ключевые факты на странице", "Highest-yield facts on one page"),
    },
    {
      id: "mock",
      icon: ClipboardList,
      color: "#10B981",
      title: tr(lang, "Materialdan sinov", "Пробный тест", "Mock test"),
      sub: tr(lang, "Materialingizdan imtihon savollari", "Экзамен из вашего материала", "Exam questions from your material"),
    },
    {
      id: "translate",
      icon: Languages,
      color: "#6366F1",
      title: tr(lang, "Tarjima + tushuntirish", "Перевод + объяснение", "Translate & explain"),
      sub: tr(lang, "Chet tilidagi materialni tarjima qilish", "Перевод материала на другом языке", "Translate foreign-language material"),
    },
    {
      id: "notes",
      icon: NotebookPen,
      color: "#22C55E",
      title: tr(lang, "Qo'lyozma → kutubxona", "Заметки → библиотека", "Notes → library"),
      sub: tr(lang, "Daftaringizni suratga olib materialga qo'shish", "Фото заметок в материалы", "Photograph notes into your materials"),
    },
    {
      id: "diagram",
      icon: Network,
      color: "#3B82F6",
      title: tr(lang, "AI diagramma", "AI-диаграмма", "AI diagram"),
      sub: tr(lang, "Mavzudan vizual sxema / mind-map", "Визуальная схема по теме", "Visual mind-map from a topic"),
    },
    {
      id: "search",
      icon: Search,
      color: "#06B6D4",
      title: tr(lang, "Daftaringizni qidirish", "Поиск по заметкам", "Search your notes"),
      sub: tr(lang, "Ma'no bo'yicha materialdan qidirish", "Смысловой поиск по материалам", "Semantic search over your materials"),
    },
    {
      id: "docs",
      icon: FolderOpen,
      color: "#64748B",
      title: tr(lang, "Materiallarim", "Мои материалы", "My materials"),
      sub: tr(lang, "Hujjatlarni ko'rish va o'chirish", "Просмотр и удаление документов", "View and delete your documents"),
    },
  ];

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => (tool ? setTool(null) : router.push("/dashboard"))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {tool ? tr(lang, "Asboblar", "Инструменты", "Tools") : "Dashboard"}
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {!tool && (
          <>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-1">
              <motion.div
                animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-6 h-6 text-violet-500" />
              </motion.div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Ilm AI Studio</h1>
            </motion.div>
            <p className="text-sm text-neutral-500 mb-6">
              {tr(
                lang,
                "Yuklagan materialingizni kuchli o'quv vositalariga aylantiring.",
                "Превратите свои материалы в мощные учебные инструменты.",
                "Turn your uploaded materials into powerful study tools."
              )}
            </p>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
              {tools.map((tl) => (
                <motion.button
                  key={tl.id}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => setTool(tl.id)}
                  className="group flex items-start gap-3 p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <motion.div
                    className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                    style={{ backgroundColor: `${tl.color}22` }}
                    whileHover={{ rotate: -6, scale: 1.08 }}
                  >
                    <tl.icon className="w-5 h-5" style={{ color: tl.color }} />
                  </motion.div>
                  <div>
                    <p className="font-bold text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{tl.title}</p>
                    <p className="text-xs text-neutral-500 leading-snug">{tl.sub}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}

        {tool === "photo" && <PhotoKitTool lang={lang} userId={user.id} />}
        {tool === "audio" && <AudioRecapTool lang={lang} userId={user.id} />}
        {tool === "map" && <KnowledgeMapTool lang={lang} userId={user.id} />}
        {tool === "cheat" && <CheatSheetTool lang={lang} userId={user.id} />}
        {tool === "mock" && <MockTool lang={lang} userId={user.id} />}
        {tool === "translate" && <TranslateTool lang={lang} userId={user.id} />}
        {tool === "notes" && <NotesTool lang={lang} userId={user.id} />}
        {tool === "diagram" && <DiagramTool lang={lang} userId={user.id} />}
        {tool === "podcast" && <PodcastTool lang={lang} userId={user.id} />}
        {tool === "search" && <SearchTool lang={lang} userId={user.id} />}
        {tool === "docs" && <DocsTool lang={lang} userId={user.id} />}
      </div>
    </div>
  );
}
