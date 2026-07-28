"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, BookOpen, Check, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import PracticeSession from "@/components/skills/PracticeSession";
import {
  getCourse,
  generateCourse,
  getLessonQuestions,
  completeCourseLesson,
  type Course,
  type CourseProgress,
} from "@/lib/courseApi";
import type { PracticeQuestion, PracticeResultItem } from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

interface ActiveLesson {
  key: string;
  chapterTitle: string;
  lessonTitle: string;
  lessonSummary: string;
  questions: PracticeQuestion[];
}

export default function CoursePage() {
  const { user, isLoading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [active, setActive] = useState<ActiveLesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    getCourse(user.id)
      .then((d) => {
        setCourse(d.course);
        setProgress(d.progress || {});
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [user]);

  async function build() {
    if (!user) return;
    setGenerating(true);
    setError("");
    try {
      const c = await generateCourse(user.id, lang);
      setCourse(c);
      setProgress({});
    } catch (e: unknown) {
      const err = e as { status?: number; detail?: string };
      setError(
        err?.detail === "no_materials" || err?.status === 400
          ? "no_materials"
          : "failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function openLesson(ci: number, li: number) {
    if (!user || !course) return;
    const key = `c${ci}l${li}`;
    const chapter = course.chapters[ci];
    const lesson = chapter.lessons[li];
    setLessonLoading(key);
    try {
      const { questions } = await getLessonQuestions({
        userId: user.id,
        chapterTitle: chapter.title,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        language: lang,
      });
      if (questions.length === 0) {
        setError("failed");
        return;
      }
      setActive({ key, chapterTitle: chapter.title, lessonTitle: lesson.title, lessonSummary: lesson.summary, questions });
    } catch {
      setError("failed");
    } finally {
      setLessonLoading(null);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Running a lesson takes over the screen.
  if (active) {
    return (
      <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PracticeSession
            lang={lang}
            title={active.lessonTitle}
            accent="#8B5CF6"
            questions={active.questions}
            onFinish={async (results: PracticeResultItem[]) => {
              const correct = results.filter((r) => r.is_correct).length;
              const score = Math.round((correct / results.length) * 100);
              try {
                const { progress: p } = await completeCourseLesson(user.id, active.key, score);
                setProgress(p);
              } catch {
                /* keep local */
                setProgress((prev) => ({ ...prev, [active.key]: { completed: true, score } }));
              }
              return { xp_awarded: correct * 5 };
            }}
            onExit={() => setActive(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-6 h-6 text-violet-500" />
          <h1 className="text-xl font-extrabold">{tr(lang, "Materialdan kurs", "Курс из материалов", "Course from materials")}</h1>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          {tr(
            lang,
            "Ilm AI siz yuklagan materiallardan tuzilgan kurs yasaydi — boblar, darslar va nazorat savollari bilan.",
            "Ilm AI строит курс из ваших материалов — главы, уроки и проверочные вопросы.",
            "Ilm AI builds a course from your uploaded materials — chapters, lessons and checkpoint questions."
          )}
        </p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
        ) : !course ? (
          <div className="rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <Sparkles className="w-10 h-10 text-violet-500 mx-auto mb-3" />
            <p className="font-bold mb-1">{tr(lang, "Kurs hali yo'q", "Курса пока нет", "No course yet")}</p>
            <p className="text-sm text-neutral-500 mb-5">
              {error === "no_materials"
                ? tr(lang, "Avval Dashboard'da material (PDF) yuklang.", "Сначала загрузите материал (PDF) в Dashboard.", "Upload material (a PDF) in the Dashboard first.")
                : error === "failed"
                ? tr(lang, "Bo'lmadi — qayta urinib ko'ring.", "Не удалось — попробуйте снова.", "Couldn't build it — try again.")
                : tr(lang, "Yuklagan materialingizdan bitta bosishda kurs yasang.", "Постройте курс из материалов одним нажатием.", "Build a course from your materials in one tap.")}
            </p>
            {error === "no_materials" ? (
              <Link href="/dashboard?panel=files" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl font-bold text-white bg-violet-600">
                <FileText className="w-4 h-4" /> {tr(lang, "Material yuklash", "Загрузить материал", "Upload material")}
              </Link>
            ) : (
              <button
                onClick={build}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? tr(lang, "Yaratilyapti...", "Создаётся...", "Building...") : tr(lang, "Kurs yaratish", "Создать курс", "Build course")}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">{course.title}</h2>
              <button onClick={build} disabled={generating} className="text-xs font-bold text-violet-500 hover:text-violet-600 disabled:opacity-50">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : tr(lang, "Qayta yasash", "Пересоздать", "Rebuild")}
              </button>
            </div>

            {course.sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {course.sources.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5">
                    <FileText className="w-3 h-3" /> {s}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {course.chapters.map((chapter, ci) => (
                <div key={ci}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 text-xs font-black">{ci + 1}</span>
                    <h3 className="font-extrabold text-sm">{chapter.title}</h3>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-neutral-200 dark:border-neutral-800 ml-3">
                    {chapter.lessons.map((lesson, li) => {
                      const key = `c${ci}l${li}`;
                      const done = progress[key]?.completed;
                      const isLoading = lessonLoading === key;
                      return (
                        <motion.button
                          key={li}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openLesson(ci, li)}
                          disabled={!!lessonLoading}
                          className="w-full text-left flex items-start gap-3 p-3 ml-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-violet-400 disabled:opacity-60"
                        >
                          <span
                            className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${
                              done ? "bg-emerald-500 text-white" : "bg-violet-100 dark:bg-violet-950 text-violet-600"
                            }`}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-sm leading-tight">{lesson.title}</p>
                            <p className="text-xs text-neutral-500 leading-snug">{lesson.summary}</p>
                            {done && (
                              <p className="text-[11px] font-bold text-emerald-500 mt-0.5">
                                {tr(lang, "Bajarildi", "Выполнено", "Completed")} · {progress[key].score}%
                              </p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
