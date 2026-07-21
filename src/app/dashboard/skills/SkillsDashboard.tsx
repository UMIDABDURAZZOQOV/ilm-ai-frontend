"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  BookOpen,
  Landmark,
  Calculator,
  Languages,
  Leaf,
  FlaskConical,
  Atom,
  Globe,
  Gift,
  User as UserIcon,
  Flag,
  CalendarCheck,
  NotebookPen,
  Zap,
  Trophy,
  Award,
  Share2,
  GraduationCap,
  Users,
  Heart,
  Feather,
  ScrollText,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  getSubjects,
  getSkillTree,
  getGamificationSummary,
  getMistakes,
  completeMistakes,
  getDailyChallenge,
  completeDailyChallenge,
  getLightningRound,
  completeLightning,
  getMarathon,
  completeMarathon,
  isLanguageSubject,
  getUnitExam,
  completeUnitExam,
  type SkillTreeUnit,
  type SkillSubject,
  type SkillTreeResponse,
  type SkillTreeLesson,
  type GamificationSummary,
  type PracticeQuestion,
  type PracticeResultItem,
} from "@/lib/skillTreeApi";
import HeartsXpHeader from "@/components/skills/HeartsXpHeader";
import LessonPath from "@/components/skills/LessonPath";
import LevelTest from "@/components/skills/LevelTest";
import PracticeSession from "@/components/skills/PracticeSession";
import Leaderboard from "@/components/skills/Leaderboard";
import Achievements from "@/components/skills/Achievements";
import ShareCard from "@/components/skills/ShareCard";
import Referral from "@/components/skills/Referral";
import Profile from "@/components/skills/Profile";
import MockExam from "@/components/skills/MockExam";
import ClassMode from "@/components/skills/ClassMode";
import ParentDashboard from "@/components/skills/ParentDashboard";

interface User {
  id: number;
  name: string;
  email: string;
}

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  ona_tili: BookOpen,
  matematika: Calculator,
  ingliz_tili: Languages,
  biologiya: Leaf,
  kimyo: FlaskConical,
  fizika: Atom,
  jahon_tarixi: Globe,
  tarix: Landmark,
  ozbek_adabiyoti: Feather,
  jahon_adabiyoti: ScrollText,
  koreys_tili: Languages,
  fransuz_tili: Languages,
};

type View =
  | "home"
  | "path"
  | "daily"
  | "mistakes"
  | "lightning"
  | "marathon"
  | "marathonPick"
  | "leaderboard"
  | "achievements"
  | "share"
  | "referral"
  | "profile"
  | "mockPick"
  | "mock"
  | "classes"
  | "parent";

function nameFor(lang: string, s: SkillSubject) {
  if (lang === "ru") return s.name_ru;
  if (lang === "en") return s.name_en;
  return s.name_uz;
}

export default function SkillsDashboard({ user }: { user: User }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [subjects, setSubjects] = useState<SkillSubject[]>([]);
  const [selected, setSelected] = useState<SkillSubject | null>(null);
  const [tree, setTree] = useState<SkillTreeResponse | null>(null);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);
  // Placement test, offered only on language subjects (ingliz/koreys/fransuz tili).
  const [showLevelTest, setShowLevelTest] = useState(false);
  // End-of-unit checkpoint exam (all subjects) — passing it unlocks the next bob.
  const [examUnit, setExamUnit] = useState<SkillTreeUnit | null>(null);
  const [examQuestions, setExamQuestions] = useState<PracticeQuestion[]>([]);
  const [marathonSubject, setMarathonSubject] = useState<SkillSubject | null>(null);
  const [mockSubject, setMockSubject] = useState<SkillSubject | null>(null);

  const refreshSummary = useCallback(() => {
    getGamificationSummary(user.id).then(setSummary).catch(() => {});
  }, [user.id]);

  const loadTree = useCallback(
    async (subject: SkillSubject) => {
      setLoading(true);
      setSelected(subject);
      setView("path");
      try {
        const data = await getSkillTree(user.id, subject.slug);
        setTree(data);
        setSummary(data.user);
      } catch {
        setTree(null);
      } finally {
        setLoading(false);
      }
    },
    [user.id]
  );

  useEffect(() => {
    getSubjects()
      .then((subs) => {
        setSubjects(subs);
        // Returning from a finished lesson (?subject=...) drops the user
        // straight back onto that subject's path — Duolingo-style, the next
        // unlocked lesson is right there instead of bouncing to the picker.
        const slug = new URLSearchParams(window.location.search).get("subject");
        const preselected = slug ? subs.find((s) => s.slug === slug) : null;
        if (preselected) {
          loadTree(preselected);
        }
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
    refreshSummary();
    getDailyChallenge(user.id).then((d) => setDailyDone(d.completed)).catch(() => {});
  }, [loadTree, refreshSummary, user.id]);

  function onSelectLesson(lesson: SkillTreeLesson) {
    if (lesson.status === "locked") return;
    router.push(`/skills/session/${lesson.id}?subject=${selected?.slug ?? ""}`);
  }

  async function openPractice(target: "daily" | "mistakes" | "lightning") {
    setPracticeLoading(true);
    setView(target);
    try {
      if (target === "daily") {
        const d = await getDailyChallenge(user.id);
        setPracticeQuestions(d.completed ? [] : d.questions);
        setDailyDone(d.completed);
      } else if (target === "mistakes") {
        const d = await getMistakes(user.id);
        setPracticeQuestions(d.questions);
      } else {
        const d = await getLightningRound(user.id);
        setPracticeQuestions(d.questions);
      }
    } catch {
      setPracticeQuestions([]);
    } finally {
      setPracticeLoading(false);
    }
  }

  async function startMarathon(subject: SkillSubject) {
    setMarathonSubject(subject);
    setPracticeLoading(true);
    setView("marathon");
    try {
      const d = await getMarathon(user.id, subject.slug);
      setPracticeQuestions(d.questions);
    } catch {
      setPracticeQuestions([]);
    } finally {
      setPracticeLoading(false);
    }
  }

  async function onSelectUnitExam(unit: SkillTreeUnit) {
    setLoading(true);
    try {
      const data = await getUnitExam(user.id, unit.id);
      setExamQuestions(data.questions);
      setExamUnit(unit);
    } catch {
      setExamUnit(null);
      setExamQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  function backHome() {
    setView("home");
    setSelected(null);
    setTree(null);
    refreshSummary();
    getDailyChallenge(user.id).then((d) => setDailyDone(d.completed)).catch(() => {});
  }

  const todayXp = summary?.today_xp ?? 0;
  const goalXp = summary?.daily_goal_xp ?? 20;
  const goalPct = Math.min(100, Math.round((todayXp / goalXp) * 100));

  // ── Sub-views ──────────────────────────────────────────────────────────────

  if (view === "leaderboard") return <Leaderboard lang={lang} onBack={backHome} />;
  if (view === "achievements") return <Achievements lang={lang} userId={user.id} onBack={backHome} />;
  if (view === "share") return <ShareCard lang={lang} userName={user.name} summary={summary} onBack={backHome} />;
  if (view === "referral") return <Referral lang={lang} userId={user.id} onBack={backHome} />;
  if (view === "profile") return <Profile lang={lang} userId={user.id} onBack={backHome} />;
  if (view === "classes") return <ClassMode lang={lang} subjects={subjects} onBack={backHome} />;
  if (view === "parent") return <ParentDashboard lang={lang} onBack={backHome} />;
  if (view === "mock" && mockSubject)
    return <MockExam lang={lang} userId={user.id} subject={mockSubject} onBack={backHome} />;

  if (view === "mockPick") {
    return (
      <div>
        <button onClick={backHome} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
          <ChevronLeft className="w-4 h-4" />
          {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
        </button>
        <h2 className="text-lg font-extrabold mb-1">{lang === "ru" ? "Пробный экзамен" : lang === "en" ? "Mock exam" : "Sinov imtihoni"}</h2>
        <p className="text-sm text-neutral-500 mb-4">
          {lang === "ru" ? "Выбери предмет — экзамен + прогноз балла" : lang === "en" ? "Pick a subject — exam + score prediction" : "Fanni tanlang — imtihon + ball bashorati"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
          {subjects.map((s) => {
            const Icon = SUBJECT_ICONS[s.slug] || BookOpen;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setMockSubject(s);
                  setView("mock");
                }}
                className="flex items-center gap-2 p-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}22` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color || "#58CC02" }} />
                </div>
                <span className="font-bold text-xs leading-tight">{nameFor(lang, s)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "marathonPick") {
    return (
      <div>
        <button onClick={backHome} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
          <ChevronLeft className="w-4 h-4" />
          {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
        </button>
        <h2 className="text-lg font-extrabold mb-1">{lang === "ru" ? "Марафон" : lang === "en" ? "Marathon" : "Marafon"}</h2>
        <p className="text-sm text-neutral-500 mb-4">
          {lang === "ru" ? "Выбери предмет — 30 вопросов подряд" : lang === "en" ? "Pick a subject — 30 questions in a row" : "Fanni tanlang — ketma-ket 30 savol"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
          {subjects.map((s) => {
            const Icon = SUBJECT_ICONS[s.slug] || BookOpen;
            return (
              <button
                key={s.id}
                onClick={() => startMarathon(s)}
                className="flex items-center gap-2 p-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}22` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color || "#58CC02" }} />
                </div>
                <span className="font-bold text-xs leading-tight">{nameFor(lang, s)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "marathon") {
    if (practiceLoading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      );
    }
    return (
      <PracticeSession
        lang={lang}
        title={`${lang === "ru" ? "Марафон" : lang === "en" ? "Marathon" : "Marafon"} · ${marathonSubject ? nameFor(lang, marathonSubject) : ""}`}
        accent="#7048E8"
        questions={practiceQuestions}
        onFinish={async (results: PracticeResultItem[]) => {
          const score = results.filter((x) => x.is_correct).length;
          const r = await completeMarathon(user.id, score, results.length);
          return { xp_awarded: r.xp_awarded };
        }}
        onExit={backHome}
      />
    );
  }

  if (view === "daily" || view === "mistakes" || view === "lightning") {
    if (practiceLoading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      );
    }
    if (view === "daily" && dailyDone && practiceQuestions.length === 0) {
      return (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold mb-1">
            {lang === "ru" ? "Сегодняшний вызов уже пройден!" : lang === "en" ? "Today's challenge is already done!" : "Bugungi sinov allaqachon bajarilgan!"}
          </p>
          <p className="text-sm text-neutral-500 mb-5">
            {lang === "ru" ? "Возвращайся завтра за новым." : lang === "en" ? "Come back tomorrow for a new one." : "Ertaga yangisi uchun qaytib keling."}
          </p>
          <button onClick={backHome} className="px-6 py-3 rounded-2xl font-bold text-white bg-emerald-500">
            {lang === "ru" ? "Назад" : lang === "en" ? "Back" : "Orqaga"}
          </button>
        </div>
      );
    }
    const titles = {
      daily: lang === "ru" ? "Ежедневный вызов" : lang === "en" ? "Daily challenge" : "Kunlik sinov",
      mistakes: lang === "ru" ? "Работа над ошибками" : lang === "en" ? "Mistakes practice" : "Xatolar ustida ishlash",
      lightning: lang === "ru" ? "Молниеносный раунд" : lang === "en" ? "Lightning round" : "Tezlik raundi",
    };
    const accents = { daily: "#58CC02", mistakes: "#FF4B4B", lightning: "#FFC800" };
    return (
      <PracticeSession
        lang={lang}
        title={titles[view]}
        accent={accents[view]}
        questions={practiceQuestions}
        timerSeconds={view === "lightning" ? 60 : undefined}
        onFinish={async (results: PracticeResultItem[]) => {
          if (view === "daily") {
            const r = await completeDailyChallenge(user.id, results);
            setDailyDone(true);
            return { xp_awarded: r.xp_awarded };
          }
          if (view === "mistakes") {
            const r = await completeMistakes(user.id, results);
            return {
              xp_awarded: r.xp_awarded,
              extraLine:
                lang === "ru"
                  ? `Осталось ошибок: ${r.remaining}`
                  : lang === "en"
                  ? `Mistakes remaining: ${r.remaining}`
                  : `Qolgan xatolar: ${r.remaining}`,
            };
          }
          const score = results.filter((x) => x.is_correct).length;
          const r = await completeLightning(user.id, score, results.length);
          return { xp_awarded: r.xp_awarded };
        }}
        onExit={backHome}
      />
    );
  }

  if (view === "path" && selected) {
    // The checkpoint exam takes over the screen while it runs.
    if (examUnit && examQuestions.length > 0) {
      const unitTitle =
        lang === "ru" ? examUnit.title_ru : lang === "en" ? examUnit.title_en : examUnit.title_uz;
      return (
        <PracticeSession
          lang={lang}
          title={`${lang === "ru" ? "Экзамен по разделу" : lang === "en" ? "Unit exam" : "Bob imtihoni"} · ${unitTitle}`}
          accent={tree?.subject.color || "#58CC02"}
          questions={examQuestions}
          onFinish={async (results: PracticeResultItem[]) => {
            const r = await completeUnitExam({ user_id: user.id, unit_id: examUnit.id, results });
            return {
              xp_awarded: r.xp_awarded,
              extraLine: r.passed
                ? lang === "ru"
                  ? "Раздел сдан — следующий открыт!"
                  : lang === "en"
                  ? "Unit passed — the next one is unlocked!"
                  : "Bob topshirildi — keyingisi ochildi!"
                : lang === "ru"
                ? `Нужно минимум ${Math.round(r.pass_threshold_pct)}% — повторите раздел`
                : lang === "en"
                ? `You need at least ${Math.round(r.pass_threshold_pct)}% — review the unit`
                : `Kamida ${Math.round(r.pass_threshold_pct)}% kerak — bobni takrorlang`,
            };
          }}
          onExit={() => {
            setExamUnit(null);
            setExamQuestions([]);
            // Reload so a freshly passed checkpoint opens the next unit.
            if (selected) loadTree(selected);
          }}
        />
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={backHome} className="flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            <ChevronLeft className="w-4 h-4" />
            {t("skills_back")}
          </button>
          <HeartsXpHeader summary={tree?.user ?? summary} />
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : tree ? (
            <motion.div key={tree.subject.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Every subject gets a placement test before the path: languages are
                  placed on CEFR, the rest on the Milliy Sertifikat 1-5 scale. */}
              {(
                <button
                  onClick={() => setShowLevelTest(true)}
                  className="w-full mb-5 flex items-center gap-3 p-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tree.subject.color || "#58CC02"}22` }}
                  >
                    <GraduationCap className="w-5 h-5" style={{ color: tree.subject.color || "#58CC02" }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold">
                      {lang === "ru"
                        ? "Тест на уровень"
                        : lang === "en"
                        ? "Placement test"
                        : "Daraja aniqlash testi"}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {isLanguageSubject(tree.subject.slug)
                        ? lang === "ru"
                          ? "Узнайте свой уровень A1–C2"
                          : lang === "en"
                          ? "Find your A1–C2 level"
                          : "Darajangizni A1–C2 shkalasida aniqlang"
                        : lang === "ru"
                        ? "Узнайте свой уровень 1–5"
                        : lang === "en"
                        ? "Find your 1–5 level"
                        : "Darajangizni 1–5 shkalasida aniqlang"}
                    </span>
                  </span>
                </button>
              )}
              <LessonPath tree={tree} onSelectLesson={onSelectLesson} onSelectUnitExam={onSelectUnitExam} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {showLevelTest && tree && (
          <LevelTest
            userId={user.id}
            subjectSlug={tree.subject.slug}
            subjectName={nameFor(lang, tree.subject)}
            accent={tree.subject.color || "#58CC02"}
            lang={lang}
            onClose={() => setShowLevelTest(false)}
          />
        )}
      </div>
    );
  }

  // ── Home hub ───────────────────────────────────────────────────────────────

  if (loading && subjects.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const featureCards: { id: View; icon: typeof Zap; color: string; title: string; sub: string; badge?: string }[] = [
    {
      id: "daily",
      icon: CalendarCheck,
      color: "#58CC02",
      title: lang === "ru" ? "Ежедневный вызов" : lang === "en" ? "Daily challenge" : "Kunlik sinov",
      sub: lang === "ru" ? "10 вопросов + бонус XP" : lang === "en" ? "10 questions + bonus XP" : "10 savol + bonus XP",
      badge: dailyDone ? "✓" : undefined,
    },
    {
      id: "mistakes",
      icon: NotebookPen,
      color: "#FF4B4B",
      title: lang === "ru" ? "Работа над ошибками" : lang === "en" ? "Mistakes" : "Xatolar daftari",
      sub: lang === "ru" ? "Исправь свои ошибки" : lang === "en" ? "Fix your mistakes" : "Xatolaringizni tuzating",
    },
    {
      id: "lightning",
      icon: Zap,
      color: "#FFC800",
      title: lang === "ru" ? "Молния" : lang === "en" ? "Lightning" : "Tezlik raundi",
      sub: lang === "ru" ? "60 секунд — сколько успеешь?" : lang === "en" ? "60 seconds — how many?" : "60 soniya — nechta ulgurasiz?",
    },
    {
      id: "marathon",
      icon: Flag,
      color: "#7048E8",
      title: lang === "ru" ? "Марафон" : lang === "en" ? "Marathon" : "Marafon",
      sub: lang === "ru" ? "30 вопросов — режим экзамена" : lang === "en" ? "30 questions — exam mode" : "30 savol — imtihon rejimi",
    },
    {
      id: "mock",
      icon: GraduationCap,
      color: "#12B886",
      title: lang === "ru" ? "Пробный экзамен" : lang === "en" ? "Mock exam" : "Sinov imtihoni",
      sub: lang === "ru" ? "Оценка + прогноз балла" : lang === "en" ? "Grade + score prediction" : "Baho + ball bashorati",
    },
    {
      id: "classes",
      icon: Users,
      color: "#4C6EF5",
      title: lang === "ru" ? "Классы" : lang === "en" ? "Classes" : "Sinf rejimi",
      sub: lang === "ru" ? "Для учителей и учеников" : lang === "en" ? "For teachers & students" : "O'qituvchi va o'quvchilar uchun",
    },
    {
      id: "parent",
      icon: Heart,
      color: "#F03E3E",
      title: lang === "ru" ? "Родителям" : lang === "en" ? "For parents" : "Ota-onalar uchun",
      sub: lang === "ru" ? "Следите за прогрессом ребёнка" : lang === "en" ? "Track your child's progress" : "Farzandingiz progressini kuzating",
    },
    {
      id: "leaderboard",
      icon: Trophy,
      color: "#FF9600",
      title: lang === "ru" ? "Рейтинг" : lang === "en" ? "Leaderboard" : "Reyting",
      sub: lang === "ru" ? "Лучшие за неделю" : lang === "en" ? "Weekly top" : "Haftaning eng zo'rlari",
    },
    {
      id: "referral",
      icon: Gift,
      color: "#F06595",
      title: lang === "ru" ? "Пригласить друга" : lang === "en" ? "Invite a friend" : "Do'st taklif qilish",
      sub: lang === "ru" ? "+50 XP вам обоим" : lang === "en" ? "+50 XP for you both" : "Ikkalangizga +50 XP",
    },
    {
      id: "profile",
      icon: UserIcon,
      color: "#20C997",
      title: lang === "ru" ? "Мой профиль" : lang === "en" ? "My profile" : "Mening profilim",
      sub: lang === "ru" ? "Статистика и лига" : lang === "en" ? "Stats & league" : "Statistika va liga",
    },
    {
      id: "achievements",
      icon: Award,
      color: "#CE82FF",
      title: lang === "ru" ? "Достижения" : lang === "en" ? "Achievements" : "Yutuqlar",
      sub: lang === "ru" ? "Собирай награды" : lang === "en" ? "Collect awards" : "Mukofotlarni to'plang",
    },
    {
      id: "share",
      icon: Share2,
      color: "#1CB0F6",
      title: lang === "ru" ? "Поделиться" : lang === "en" ? "Share" : "Ulashish",
      sub: lang === "ru" ? "Покажи свой прогресс" : lang === "en" ? "Show your progress" : "Natijangizni ko'rsating",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold">{t("dash_skills") || "Fanlar"}</h2>
        <HeartsXpHeader summary={summary} />
      </div>

      {/* Daily goal */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 mb-5 max-w-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">
            {lang === "ru" ? "Цель дня" : lang === "en" ? "Daily goal" : "Kunlik maqsad"}
          </p>
          <p className="text-xs font-extrabold" style={{ color: goalPct >= 100 ? "#58CC02" : "#94a3b8" }}>
            {todayXp}/{goalXp} XP {goalPct >= 100 ? "🎉" : ""}
          </p>
        </div>
        <div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#58CC02" }}
            animate={{ width: `${goalPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Subjects */}
      <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 mb-2">
        {lang === "ru" ? "Предметы" : lang === "en" ? "Subjects" : "Fanlar"}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mb-6">
        {subjects.map((s) => {
          const Icon = SUBJECT_ICONS[s.slug] || BookOpen;
          return (
            <motion.button
              key={s.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadTree(s)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}22` }}>
                <Icon className="w-6 h-6" style={{ color: s.color || "#58CC02" }} />
              </div>
              <span className="font-bold text-xs text-center leading-tight">{nameFor(lang, s)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Engagement features */}
      <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 mb-2">
        {lang === "ru" ? "Ещё" : lang === "en" ? "More" : "Yana"}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
        {featureCards.map((c) => (
          <motion.button
            key={c.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (c.id === "daily" || c.id === "mistakes" || c.id === "lightning") openPractice(c.id);
              else if (c.id === "marathon") setView("marathonPick");
              else if (c.id === "mock") setView("mockPick");
              else setView(c.id);
            }}
            className="relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left"
          >
            {c.badge && (
              <span className="absolute top-2 right-2 text-xs font-extrabold text-emerald-500">{c.badge}</span>
            )}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}22` }}>
              <c.icon className="w-5 h-5" style={{ color: c.color }} />
            </div>
            <span className="font-bold text-sm">{c.title}</span>
            <span className="text-[11px] text-neutral-500 leading-tight">{c.sub}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
