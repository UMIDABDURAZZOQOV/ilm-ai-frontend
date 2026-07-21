"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { SkillTreeResponse, SkillTreeLesson, SkillTreeUnit } from "@/lib/skillTreeApi";
import LessonNode from "./LessonNode";
import Mascot from "./Mascot";

const NODE_SPACING = 104;
const AMPLITUDE = 70;
const CENTER_X = 160;

function titleFor(lang: string, obj: { title_uz: string; title_ru: string; title_en: string }) {
  if (lang === "ru") return obj.title_ru;
  if (lang === "en") return obj.title_en;
  return obj.title_uz;
}

/** A node on the path is either a lesson or the unit's end-of-bob checkpoint. */
type PathItem =
  | { kind: "lesson"; lesson: SkillTreeLesson; unitTitle: string; unitStart: boolean }
  | { kind: "exam"; unit: SkillTreeUnit; unitTitle: string };

export default function LessonPath({
  tree,
  onSelectLesson,
  onSelectUnitExam,
}: {
  tree: SkillTreeResponse;
  onSelectLesson: (lesson: SkillTreeLesson) => void;
  onSelectUnitExam?: (unit: SkillTreeUnit) => void;
}) {
  const { lang } = useI18n();
  const accent = tree.subject.color || "#58CC02";

  const flat = useMemo(() => {
    const items: PathItem[] = [];
    tree.units.forEach((u) => {
      const unitTitle = titleFor(lang, u);
      u.lessons.forEach((l, i) => {
        items.push({ kind: "lesson", lesson: l, unitTitle, unitStart: i === 0 });
      });
      // Checkpoint exam closes the unit — passing it opens the next bob.
      if (u.exam && u.exam.status !== "none") {
        items.push({ kind: "exam", unit: u, unitTitle });
      }
    });
    return items;
  }, [tree, lang]);

  const points = flat.map((_, i) => ({
    x: CENTER_X + AMPLITUDE * Math.sin(i * 0.9),
    y: 60 + i * NODE_SPACING,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const midY = (prev.y + p.y) / 2;
    return `${acc} Q ${prev.x} ${midY}, ${(prev.x + p.x) / 2} ${midY} Q ${p.x} ${midY}, ${p.x} ${p.y}`;
  }, "");

  const height = 60 + flat.length * NODE_SPACING + 80;
  const firstCurrent = flat.find((f) => f.kind === "lesson" && f.lesson.status === "unlocked");

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3 mb-4">
        <Mascot mood="idle" size={64} />
        <div className="text-sm text-neutral-500 max-w-[220px]">
          {lang === "ru" ? "Продолжай учиться!" : lang === "en" ? "Keep learning!" : "Davom eting!"}
        </div>
      </div>
      <div className="relative" style={{ width: CENTER_X * 2, height }}>
        <svg className="absolute inset-0" width={CENTER_X * 2} height={height}>
          <path d={pathD} stroke={accent} strokeWidth={6} strokeDasharray="2 16" strokeLinecap="round" fill="none" opacity={0.5} />
        </svg>

        {flat.map((item, i) => {
          const key = item.kind === "lesson" ? `l-${item.lesson.id}` : `e-${item.unit.id}`;
          const showUnitTitle = item.kind === "lesson" && item.unitStart;
          return (
            <div key={key}>
              {/* `-translate-y-full` anchors the pill's BOTTOM edge at `top`, so a
                  one- or two-line unit title always grows upward and can never sit
                  on top of the node (which used to hide the text). */}
              {showUnitTitle && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-full max-w-[280px] text-center text-xs font-bold uppercase tracking-wide text-white px-3 py-1.5 rounded-full shadow-md"
                  style={{ top: points[i].y - 42, backgroundColor: accent }}
                >
                  {item.unitTitle}
                </div>
              )}

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: points[i].x, top: points[i].y }}
              >
                {item.kind === "lesson" ? (
                  <LessonNode
                    lesson={item.lesson}
                    title={titleFor(lang, item.lesson)}
                    color={accent}
                    onClick={() => onSelectLesson(item.lesson)}
                  />
                ) : (
                  <UnitExamNode
                    unit={item.unit}
                    lang={lang}
                    color={accent}
                    onClick={() => onSelectUnitExam?.(item.unit)}
                  />
                )}
              </div>

              {firstCurrent &&
                item.kind === "lesson" &&
                firstCurrent.kind === "lesson" &&
                firstCurrent.lesson.id === item.lesson.id && (
                  <div
                    className="absolute -translate-x-1/2 text-xs font-extrabold px-3 py-1 rounded-xl text-white shadow-md"
                    style={{ left: points[i].x, top: points[i].y + 40, backgroundColor: accent }}
                  >
                    {lang === "ru" ? "НАЧАТЬ" : lang === "en" ? "START" : "BOSHLASH"}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** End-of-unit checkpoint: a trophy node, visually distinct from lesson circles. */
function UnitExamNode({
  unit,
  lang,
  color,
  onClick,
}: {
  unit: SkillTreeUnit;
  lang: string;
  color: string;
  onClick: () => void;
}) {
  const status = unit.exam?.status ?? "locked";
  const locked = status === "locked";
  const passed = status === "passed";

  const label =
    lang === "ru" ? "Экзамен по разделу" : lang === "en" ? "Unit exam" : "Bob imtihoni";

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={locked ? {} : { scale: 1.06 }}
        whileTap={locked ? {} : { scale: 0.94 }}
        onClick={onClick}
        disabled={locked}
        title={`${label} — ${titleFor(lang, unit)}`}
        className={`relative w-[70px] h-[70px] rounded-2xl flex items-center justify-center border-4 border-b-8 ${
          locked
            ? "bg-neutral-200 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 cursor-not-allowed"
            : ""
        }`}
        style={locked ? {} : { backgroundColor: passed ? color : "#fff", borderColor: color }}
      >
        {locked ? (
          <Lock className="w-6 h-6 text-neutral-400" />
        ) : (
          <Trophy className="w-7 h-7" style={{ color: passed ? "#fff" : color }} strokeWidth={2.5} />
        )}
      </motion.button>
      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 text-center max-w-[110px] leading-tight">
        {label}
      </div>
    </div>
  );
}
