"use client";

import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { mockFromMaterials } from "@/lib/studioApi";
import PracticeSession from "@/components/skills/PracticeSession";
import type { PracticeQuestion, PracticeResultItem } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

const LENGTHS = [10, 15, 20];

export default function MockTool({ lang, userId }: { lang: string; userId: number }) {
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState(15);
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [error, setError] = useState("");

  async function build() {
    setBusy(true);
    setError("");
    try {
      const r = await mockFromMaterials(userId, lang, n);
      setQuestions(r.questions);
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(err?.detail === "no_materials" || err?.status === 400 ? "no_materials" : "failed");
    } finally {
      setBusy(false);
    }
  }

  if (questions) {
    return (
      <PracticeSession
        lang={lang}
        title={tr(lang, "Materialdan sinov", "Пробный тест", "Mock test")}
        accent="#10B981"
        questions={questions}
        onFinish={async (results: PracticeResultItem[]) => {
          const correct = results.filter((r) => r.is_correct).length;
          return {
            xp_awarded: correct * 5,
            extraLine: `${correct}/${results.length}`,
          };
        }}
        onExit={() => setQuestions(null)}
      />
    );
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1">{tr(lang, "Materialdan sinov", "Пробный тест", "Mock test")}</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {tr(lang, "Materialingizni qamrab oluvchi imtihon savollari.", "Экзаменационные вопросы по вашему материалу.", "Exam-style questions covering your material.")}
      </p>

      <div className="flex items-center gap-2 mb-4">
        {LENGTHS.map((len) => (
          <button
            key={len}
            onClick={() => setN(len)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
              n === len ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600" : "border-neutral-200 dark:border-neutral-800 text-neutral-500"
            }`}
          >
            {len} {tr(lang, "savol", "вопр.", "questions")}
          </button>
        ))}
      </div>

      <button onClick={build} disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
        {busy ? tr(lang, "Tuzilyapti...", "Создаётся...", "Building...") : tr(lang, "Sinovni boshlash", "Начать тест", "Start mock test")}
      </button>

      {error === "no_materials" && <p className="text-sm text-amber-600 mt-3">{tr(lang, "Avval material yuklang.", "Сначала загрузите материал.", "Upload material first.")}</p>}
      {error === "failed" && <p className="text-sm text-red-500 mt-3">{tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")}</p>}
    </div>
  );
}
