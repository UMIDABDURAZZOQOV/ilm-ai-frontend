"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, BookOpen, Wand2, Timer, Command, ArrowRight, X } from "lucide-react";

const KEY = "ilm_onboarded_v1";

type Step = { icon: typeof Sparkles; color: string; title: Record<string, string>; body: Record<string, string> };

const STEPS: Step[] = [
  {
    icon: Sparkles, color: "#6366F1",
    title: { uz: "Ilm AI'ga xush kelibsiz 👋", ru: "Добро пожаловать в Ilm AI 👋", en: "Welcome to Ilm AI 👋" },
    body: {
      uz: "Bu — sizni biladigan shaxsiy AI repetitor. O'z materialingizni yuklab, undan o'rganasiz.",
      ru: "Это ваш персональный AI-репетитор, который вас знает. Загрузите материал и учитесь по нему.",
      en: "Your personal AI tutor that knows you. Upload your material and learn from it.",
    },
  },
  {
    icon: FileText, color: "#3B82F6",
    title: { uz: "Materialingizni yuklang", ru: "Загрузите материал", en: "Upload your material" },
    body: {
      uz: "PDF, daftar surati yoki matn — companion shundan savol-javob, viktorina va flashcard yasaydi.",
      ru: "PDF, фото заметок или текст — по нему будут вопросы, тесты и карточки.",
      en: "A PDF, a photo of notes, or text — the companion turns it into Q&A, quizzes and flashcards.",
    },
  },
  {
    icon: BookOpen, color: "#8B5CF6",
    title: { uz: "Materialdan kurs", ru: "Курс из материалов", en: "Course from materials" },
    body: {
      uz: "Ilm AI yuklaganingizdan tuzilgan kurs yasaydi — boblar, darslar va nazorat savollari bilan.",
      ru: "Ilm AI строит курс из ваших материалов: главы, уроки и проверочные вопросы.",
      en: "Ilm AI builds a structured course from your uploads — chapters, lessons, checkpoints.",
    },
  },
  {
    icon: Wand2, color: "#F43F5E",
    title: { uz: "Ilm AI Studio — 11 asbob", ru: "Ilm AI Studio — 11 инструментов", en: "Ilm AI Studio — 11 tools" },
    body: {
      uz: "Rasmdan to'plam, audio konspekt, bilim xaritasi, shpargalka, sinov, diagramma va boshqalar.",
      ru: "Набор из фото, аудио-конспект, карта знаний, шпаргалка, тест, диаграмма и другое.",
      en: "Photo kit, audio recap, knowledge map, cheat sheet, mock test, diagram and more.",
    },
  },
  {
    icon: Timer, color: "#10B981",
    title: { uz: "Fokus rejimi", ru: "Фокус-режим", en: "Focus mode" },
    body: {
      uz: "Pomodoro taymer bilan diqqatni jamlang — tanaffusда materialdan tez viktorina.",
      ru: "Сфокусируйтесь с таймером Помодоро — на перерыве быстрый тест по материалу.",
      en: "Stay focused with a Pomodoro timer — a quick quiz from your material on breaks.",
    },
  },
  {
    icon: Command, color: "#0EA5E9",
    title: { uz: "Tez qidiruv: Ctrl / Cmd + K", ru: "Быстрый поиск: Ctrl / Cmd + K", en: "Quick search: Ctrl / Cmd + K" },
    body: {
      uz: "Istalgan sahifa yoki asbobga bir zumda o'ting. Ilovani telefoningizga ham o'rnatsangiz bo'ladi!",
      ru: "Мгновенно переходите куда угодно. Приложение можно установить на телефон!",
      en: "Jump anywhere instantly. You can even install the app on your phone!",
    },
  },
];

export default function OnboardingTour({ lang = "uz" }: { lang?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setOpen(true); } catch { /* ignore */ }
  }, []);

  function done() {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  }

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const L = (m: Record<string, string>) => m[lang] ?? m.uz;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 relative"
          >
            <button onClick={done} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4" style={{ backgroundColor: `${step.color}22` }}>
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <h2 className="text-xl font-extrabold mb-1.5">{L(step.title)}</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{L(step.body)}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 my-5">
              {STEPS.map((_, k) => (
                <div key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-indigo-500" : "w-1.5 bg-neutral-300 dark:bg-neutral-700"}`} />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={done} className="text-sm font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                {lang === "ru" ? "Пропустить" : lang === "en" ? "Skip" : "O'tkazib yuborish"}
              </button>
              <button
                onClick={() => {
                  if (last) { done(); router.push("/dashboard?panel=files"); }
                  else setI((x) => x + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {last ? (lang === "ru" ? "Начать" : lang === "en" ? "Get started" : "Boshlash") : (lang === "ru" ? "Далее" : lang === "en" ? "Next" : "Keyingi")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
