"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

// A rotating study tip / bit of encouragement, chosen deterministically by the
// day so everyone sees the same one and it changes daily. Trilingual.
const TIPS: { uz: string; ru: string; en: string }[] = [
  { uz: "Kichik, muntazam qadamlar katta sakrashdan kuchliroq. Har kuni 20 daqiqa yeting.", ru: "Маленькие регулярные шаги сильнее рывков. Занимайтесь по 20 минут в день.", en: "Small daily steps beat rare big leaps. Aim for 20 focused minutes." },
  { uz: "Bir mavzuni o'zingizga ovoz chiqarib tushuntiring — bilmagan joyingiz shunda ochiladi.", ru: "Объясните тему вслух себе — так вы найдёте пробелы.", en: "Explain a topic out loud to yourself — that's where the gaps show." },
  { uz: "Xatolaringiz eng yaxshi o'qituvchi. Ularni takrorlab, ustida ishlang.", ru: "Ошибки — лучший учитель. Возвращайтесь к ним и прорабатывайте.", en: "Your mistakes are the best teacher. Revisit and drill them." },
  { uz: "O'qishdan oldin telefonni boshqa xonaga qo'ying. Diqqat — eng qimmatli resurs.", ru: "Перед учёбой уберите телефон. Внимание — ценнейший ресурс.", en: "Put your phone in another room before studying. Attention is precious." },
  { uz: "Yangi o'qiganingizni 24 soat ichida takrorlang — xotirada mustahkam qoladi.", ru: "Повторите новое в течение 24 часов — так оно закрепится.", en: "Review new material within 24 hours to lock it into memory." },
  { uz: "Fokus rejimi (Pomodoro) bilan ishlang: 25 daqiqa mehnat, 5 daqiqa dam.", ru: "Работайте по Помодоро: 25 минут труда, 5 минут отдыха.", en: "Work in Pomodoros: 25 minutes on, 5 minutes off." },
  { uz: "Materialingizni Ilm AI'ga yuklab, undan viktorina va flashcard yasang.", ru: "Загрузите материал в Ilm AI и сделайте тест и карточки.", en: "Upload your material to Ilm AI and turn it into quizzes and flashcards." },
  { uz: "Qiyin savolni tashlab ketmang — AI repetitordan 'soddaroq' tushuntirishni so'rang.", ru: "Не бросайте трудный вопрос — попросите ИИ объяснить проще.", en: "Don't skip a hard question — ask the AI tutor to explain it simpler." },
  { uz: "Har kuni bir oz — dangasalik kunidan ko'ra streak muhimroq.", ru: "Понемногу каждый день — серия важнее одного рывка.", en: "A little every day — the streak matters more than one big push." },
  { uz: "Uyquni qurbon qilmang. Charchagan miya yangi narsani yomon eslaydi.", ru: "Не жертвуйте сном. Уставший мозг плохо запоминает.", en: "Don't sacrifice sleep. A tired brain remembers poorly." },
  { uz: "Imtihon sanasini belgilang — maqsad aniq bo'lsa, reja o'zi tuziladi.", ru: "Укажите дату экзамена — с чёткой целью план строится сам.", en: "Set your exam date — a clear goal makes the plan build itself." },
  { uz: "O'zingizni test qiling, qayta o'qimang. Sinash o'rganishni kuchaytiradi.", ru: "Тестируйте себя, а не перечитывайте. Проверка усиливает обучение.", en: "Test yourself instead of rereading. Retrieval strengthens learning." },
];

function todayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return day % TIPS.length;
}

export default function DailyTip({ lang = "uz" }: { lang?: string }) {
  const tip = TIPS[todayIndex()];
  const text = lang === "ru" ? tip.ru : lang === "en" ? tip.en : tip.uz;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 p-4 flex items-start gap-3"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="mt-0.5 shrink-0"
      >
        <Lightbulb className="h-5 w-5 text-amber-500" />
      </motion.div>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 mb-0.5">
          {lang === "ru" ? "Совет дня" : lang === "en" ? "Tip of the day" : "Kunlik maslahat"}
        </p>
        <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
}
