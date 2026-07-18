"use client";

/**
 * ProductDemos — an animated, interactive showcase of the four Ilm AI prep
 * products (SAT, IELTS, College App, Milliy Sertifikat). Every illustration
 * here is drawn from scratch with SVG/CSS + framer-motion (no third-party art
 * or logos); the layout patterns are inspired by modern ed-tech landing pages
 * but all content and styling is Ilm AI's own.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Flame,
  Zap,
  Star,
  TrendingUp,
  GraduationCap,
  Languages,
  Building2,
  BookOpen,
  Bookmark,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

/** Loops 0..(steps-1) forever on an interval; drives the auto-playing demos. */
function useTick(steps: number, ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x + 1) % steps), ms);
    return () => clearInterval(id);
  }, [steps, ms]);
  return t;
}

/** Count-up number that eases toward `to` whenever `to` changes. */
function useCountUp(to: number, ms = 900) {
  const [n, setN] = useState(to);
  useEffect(() => {
    const from = n;
    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return n;
}

const cardCls =
  "rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] backdrop-blur shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)] p-5 sm:p-6";

// ── SAT demo: a question card that reveals the answer, plus a solved equation ──
function SatDemo({ lang }: { lang: string }) {
  const options = ["3", "5", "15", "45"];
  const correct = 1;
  const tick = useTick(6, 800); // 0..3 hover, 4 reveal, 5 hold
  const revealed = tick >= 4;
  const score = useCountUp(revealed ? 1420 : 1200);

  return (
    <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-4">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-op-skyText bg-op-sky dark:bg-sky-500/15 px-2.5 py-1 rounded-full">
            Digital SAT · Math
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <Clock className="w-3.5 h-3.5" /> 00:49
          </span>
        </div>
        <p className="font-semibold text-[15px] mb-4 text-slate-800 dark:text-slate-100">
          If <span className="font-serif-sat italic">3x + 5 = 20</span>, {tr(lang, "x nechaga teng?", "чему равно x?", "what is the value of x?")}
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const hovering = !revealed && tick === i;
            const showCorrect = revealed && i === correct;
            return (
              <motion.div
                key={opt}
                animate={{
                  scale: hovering || showCorrect ? 1.015 : 1,
                  borderColor: showCorrect ? "#22c55e" : hovering ? "#94a3b8" : "rgba(148,163,184,0.25)",
                  backgroundColor: showCorrect ? "rgba(34,197,94,0.10)" : "rgba(0,0,0,0)",
                }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5"
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-full grid place-items-center text-[11px] font-extrabold ${
                    showCorrect ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                  }`}
                >
                  {showCorrect ? <Check className="w-3.5 h-3.5" /> : String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{opt}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className={`${cardCls} flex-1`}>
          <p className="text-xs font-bold text-slate-400 mb-1">{tr(lang, "Bashorat qilingan ball", "Прогноз балла", "Predicted score")}</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-op-teal dark:text-cyan-300 tabular-nums">{score}</span>
            <span className="flex items-center gap-0.5 text-green-500 text-xs font-bold mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> +220
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { l: "Reading & Writing", w: 88 },
              { l: "Algebra", w: 64 },
              { l: "Advanced Math", w: 47 },
            ].map((r) => (
              <div key={r.l}>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>{r.l}</span>
                  <span>{r.w}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${r.w}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-op-teal to-op-blue"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${cardCls} font-serif-sat`}>
          <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2">{tr(lang, "Yechim", "Решение", "Step-by-step")}</p>
          {["3x + 5 = 20", "3x = 15", "x = 5"].map((step, i) => (
            <motion.p
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: revealed && i <= (tick - 4) + 1 ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`text-[15px] italic ${i === 2 ? "text-green-600 dark:text-green-400 font-bold" : "text-slate-600 dark:text-slate-300"}`}
            >
              {step}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── IELTS demo: an animated band-score dial + criteria bars ────────────────────
function IeltsDemo({ lang }: { lang: string }) {
  const tick = useTick(2, 2200);
  const band = tick === 0 ? 7.5 : 8.0;
  const shown = useCountUp(Math.round(band * 10)) / 10;
  const criteria = [
    { l: tr(lang, "Ravonlik", "Беглость", "Fluency"), v: 7.5 },
    { l: tr(lang, "Lug'at", "Лексика", "Lexical"), v: 8.0 },
    { l: tr(lang, "Grammatika", "Грамматика", "Grammar"), v: 7.0 },
    { l: tr(lang, "Talaffuz", "Произношение", "Pronunciation"), v: 8.0 },
  ];
  const circ = 2 * Math.PI * 52;
  return (
    <div className="grid sm:grid-cols-[0.9fr_1.1fr] gap-4">
      <div className={`${cardCls} flex flex-col items-center justify-center`}>
        <span className="text-[11px] font-extrabold tracking-wider uppercase text-fuchsia-500 bg-fuchsia-500/10 px-2.5 py-1 rounded-full mb-3">
          IELTS · Speaking
        </span>
        <div className="relative w-[132px] h-[132px]">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-white/10" />
            <motion.circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
              className="stroke-fuchsia-500"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ - (band / 9) * circ }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums">{shown.toFixed(1)}</div>
              <div className="text-[10px] font-bold text-slate-400">{tr(lang, "Band", "Балл", "Band")}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={cardCls}>
        <p className="text-xs font-bold text-slate-400 mb-3">{tr(lang, "AI baholash (4 mezon)", "AI-оценка (4 критерия)", "AI grading · 4 criteria")}</p>
        <div className="space-y-3">
          {criteria.map((c) => (
            <div key={c.l}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">{c.l}</span>
                <span className="text-fuchsia-500">{c.v.toFixed(1)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(c.v / 9) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── College App demo: college cards + a "fit" ring animating in ────────────────
function CollegeDemo({ lang }: { lang: string }) {
  const colleges = [
    { n: tr(lang, "Milliy universitet", "Нац. университет", "National University"), rate: 64, sat: 1170, tag: tr(lang, "Mos", "Подходит", "Match"), color: "#22c55e" },
    { n: tr(lang, "Texnologiya instituti", "Технологический институт", "Institute of Technology"), rate: 22, sat: 1480, tag: tr(lang, "Yuqori", "Амбициозный", "Reach"), color: "#f97316" },
    { n: tr(lang, "Iqtisodiyot akademiyasi", "Академия экономики", "Academy of Economics"), rate: 78, sat: 1050, tag: tr(lang, "Ishonchli", "Надёжный", "Safety"), color: "#3b82f6" },
  ];
  return (
    <div className="grid gap-3">
      {colleges.map((c, i) => (
        <motion.div
          key={c.n}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
          className={`${cardCls} flex items-center gap-4 !p-4`}
        >
          <div className="w-11 h-11 rounded-2xl grid place-items-center text-white font-black shrink-0" style={{ backgroundColor: c.color }}>
            {c.n.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{c.n}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: c.color, backgroundColor: `${c.color}1a` }}>
              {c.tag}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400">{tr(lang, "Qabul", "Приём", "Acceptance")}</p>
            <p className="font-black text-sm text-slate-700 dark:text-slate-200">{c.rate}%</p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[10px] text-slate-400">Median SAT</p>
            <p className="font-black text-sm text-slate-700 dark:text-slate-200">{c.sat}</p>
          </div>
          <Bookmark className="w-4 h-4 text-slate-300 shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}

// ── Milliy Sertifikat demo: a mini skill-tree lighting up (Duolingo-style) ─────
function MilliyDemo({ lang }: { lang: string }) {
  const nodes = 4;
  const tick = useTick(nodes + 2, 700); // last steps hold before loop
  const done = Math.min(tick, nodes);
  const xp = useCountUp(done * 15);
  const positions = [
    { x: 50, y: 12 },
    { x: 68, y: 34 },
    { x: 42, y: 56 },
    { x: 58, y: 80 },
  ];
  return (
    <div className="grid sm:grid-cols-[1fr_0.8fr] gap-4">
      <div className={`${cardCls} relative overflow-hidden`} style={{ minHeight: 260 }}>
        <span className="text-[11px] font-extrabold tracking-wider uppercase text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
          {tr(lang, "Milliy Sertifikat · Ona tili", "Milliy Sertifikat", "Milliy Sertifikat")}
        </span>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path
            d={`M ${positions[0].x} ${positions[0].y} Q ${positions[1].x + 12} ${(positions[0].y + positions[1].y) / 2} ${positions[1].x} ${positions[1].y} Q ${positions[2].x - 14} ${(positions[1].y + positions[2].y) / 2} ${positions[2].x} ${positions[2].y} Q ${positions[3].x + 12} ${(positions[2].y + positions[3].y) / 2} ${positions[3].x} ${positions[3].y}`}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.4"
            strokeDasharray="2 2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {positions.map((p, i) => {
          const isDone = i < done;
          const isCurrent = i === done;
          return (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={isCurrent ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 }}
            >
              <div
                className={`w-11 h-11 rounded-full grid place-items-center shadow-lg border-b-4 ${
                  isDone
                    ? "bg-green-500 border-green-700 text-white"
                    : isCurrent
                    ? "bg-white dark:bg-slate-800 border-green-500 text-green-500"
                    : "bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/10 text-slate-400"
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Star className="w-5 h-5" fill={isCurrent ? "none" : "currentColor"} />}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-col gap-4">
        <div className={`${cardCls} flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 grid place-items-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">{xp}</div>
            <div className="text-[10px] text-slate-400 font-bold">XP</div>
          </div>
        </div>
        <div className={`${cardCls} flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 grid place-items-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">7</div>
            <div className="text-[10px] text-slate-400 font-bold">{tr(lang, "kunlik seriya", "дней подряд", "day streak")}</div>
          </div>
        </div>
        <motion.div
          className={`${cardCls} flex items-center gap-3 !py-3`}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BookOpen className="w-5 h-5 text-green-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tr(lang, "Duolingo uslubida", "В стиле Duolingo", "Duolingo-style path")}</span>
        </motion.div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "sat", icon: GraduationCap, color: "#0E607A", label: "SAT" },
  { id: "ielts", icon: Languages, color: "#d946ef", label: "IELTS" },
  { id: "college", icon: Building2, color: "#3b82f6", label: "College App" },
  { id: "milliy", icon: BookOpen, color: "#22c55e", label: "Milliy Sertifikat" },
] as const;

export default function ProductDemos() {
  const { lang } = useI18n();
  const [active, setActive] = useState(0);

  return (
    <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {tr(lang, "Bitta platforma — barcha imtihonlar", "Одна платформа — все экзамены", "One platform — every exam")}
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {tr(
            lang,
            "SAT, IELTS, College Application va Milliy Sertifikat — jonli, interaktiv tayyorgarlik.",
            "SAT, IELTS, College Application и Milliy Sertifikat — живая интерактивная подготовка.",
            "SAT, IELTS, College Application and Milliy Sertifikat — live, interactive prep."
          )}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {TABS.map((t, i) => {
          const on = active === i;
          return (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
                on ? "text-white shadow-lg scale-105" : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
              style={on ? { backgroundColor: t.color } : undefined}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Demo panel */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={TABS[active].id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {active === 0 && <SatDemo lang={lang} />}
            {active === 1 && <IeltsDemo lang={lang} />}
            {active === 2 && <CollegeDemo lang={lang} />}
            {active === 3 && <MilliyDemo lang={lang} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
