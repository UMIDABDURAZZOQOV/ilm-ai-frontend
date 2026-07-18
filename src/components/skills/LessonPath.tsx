"use client";

import { useMemo } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { SkillTreeResponse, SkillTreeLesson } from "@/lib/skillTreeApi";
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

export default function LessonPath({
  tree,
  onSelectLesson,
}: {
  tree: SkillTreeResponse;
  onSelectLesson: (lesson: SkillTreeLesson) => void;
}) {
  const { lang } = useI18n();

  const flat = useMemo(() => {
    const items: { lesson: SkillTreeLesson; unitTitle: string; unitStart: boolean }[] = [];
    tree.units.forEach((u) => {
      u.lessons.forEach((l, i) => {
        items.push({ lesson: l, unitTitle: titleFor(lang, u), unitStart: i === 0 });
      });
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
  const firstCurrent = flat.find((f) => f.lesson.status === "unlocked");

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
          <path d={pathD} stroke={tree.subject.color || "#58CC02"} strokeWidth={6} strokeDasharray="2 16" strokeLinecap="round" fill="none" opacity={0.5} />
        </svg>
        {flat.map((item, i) => (
          <div key={item.lesson.id}>
            {item.unitStart && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wide text-white px-3 py-1 rounded-full"
                style={{ top: points[i].y - 44, backgroundColor: tree.subject.color || "#58CC02" }}
              >
                {item.unitTitle}
              </div>
            )}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: points[i].x, top: points[i].y }}
            >
              <LessonNode
                lesson={item.lesson}
                title={titleFor(lang, item.lesson)}
                color={tree.subject.color || "#58CC02"}
                onClick={() => onSelectLesson(item.lesson)}
              />
            </div>
            {firstCurrent?.lesson.id === item.lesson.id && (
              <div
                className="absolute -translate-x-1/2 text-xs font-extrabold px-3 py-1 rounded-xl text-white shadow-md"
                style={{ left: points[i].x, top: points[i].y + 40, backgroundColor: tree.subject.color || "#58CC02" }}
              >
                {lang === "ru" ? "НАЧАТЬ" : lang === "en" ? "START" : "BOSHLASH"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
