"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Users,
  Plus,
  Copy,
  Check,
  Flame,
  Zap,
  Trash2,
  BookMarked,
} from "lucide-react";
import {
  getMyClasses,
  createClass,
  joinClass,
  getClassDetail,
  createAssignment,
  deleteAssignment,
  removeMember,
  type SkillSubject,
  type ClassBrief,
  type EnrolledClass,
  type ClassDetail,
} from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

function subjName(lang: string, s: SkillSubject) {
  return lang === "ru" ? s.name_ru : lang === "en" ? s.name_en : s.name_uz;
}

export default function ClassMode({
  lang,
  subjects,
  onBack,
}: {
  lang: string;
  subjects: SkillSubject[];
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [teaching, setTeaching] = useState<ClassBrief[]>([]);
  const [enrolled, setEnrolled] = useState<EnrolledClass[]>([]);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // create/join forms
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState<string>("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // assignment form
  const [assignTitle, setAssignTitle] = useState("");
  const [assignSubject, setAssignSubject] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getMyClasses()
      .then((d) => {
        setTeaching(d.teaching);
        setEnrolled(d.enrolled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openClass(classId: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await getClassDetail(classId));
    } catch {
      setMsg({ ok: false, text: tr(lang, "Ochib bo'lmadi", "Не удалось открыть", "Could not open") });
    } finally {
      setDetailLoading(false);
    }
  }

  async function doCreate() {
    if (!newName.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await createClass(newName.trim(), newSubject || null);
      setNewName("");
      setNewSubject("");
      load();
      setMsg({ ok: true, text: tr(lang, "Sinf yaratildi", "Класс создан", "Class created") });
    } catch {
      setMsg({ ok: false, text: tr(lang, "Xatolik", "Ошибка", "Error") });
    } finally {
      setBusy(false);
    }
  }

  async function doJoin() {
    if (!joinCode.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await joinClass(joinCode.trim());
      setJoinCode("");
      load();
      setMsg({ ok: true, text: r.already ? tr(lang, "Siz allaqachon a'zosiz", "Вы уже в классе", "Already a member") : tr(lang, `"${r.name}" sinfiga qo'shildingiz`, `Вы вступили в "${r.name}"`, `Joined "${r.name}"`) });
    } catch (e) {
      const d = (e as { detail?: string })?.detail;
      const map: Record<string, string> = {
        invalid_code: tr(lang, "Kod noto'g'ri", "Неверный код", "Invalid code"),
        own_class: tr(lang, "Bu sizning sinfingiz", "Это ваш класс", "This is your own class"),
      };
      setMsg({ ok: false, text: map[d ?? ""] ?? tr(lang, "Xatolik", "Ошибка", "Error") });
    } finally {
      setBusy(false);
    }
  }

  async function doAssign() {
    if (!detail || !assignTitle.trim()) return;
    setBusy(true);
    try {
      await createAssignment(detail.id, { title: assignTitle.trim(), subject_slug: assignSubject || null });
      setAssignTitle("");
      setAssignSubject("");
      openClass(detail.id);
    } finally {
      setBusy(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Class detail (teacher) ────────────────────────────────────────────────────
  if (detail) {
    return (
      <div>
        <button onClick={() => setDetail(null)} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> {tr(lang, "Sinflar", "Классы", "Classes")}
        </button>
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-extrabold">{detail.name}</h2>
            <button
              onClick={() => copyCode(detail.join_code)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold text-sm"
            >
              {tr(lang, "Kod", "Код", "Code")}: <span className="tracking-widest">{detail.join_code}</span>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Roster */}
          <div>
            <p className="text-sm font-bold mb-2">{tr(lang, "O'quvchilar", "Ученики", "Students")} ({detail.roster.length})</p>
            {detail.roster.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                {tr(lang, "Hali o'quvchi yo'q. Kodni ulashing.", "Пока нет учеников. Поделитесь кодом.", "No students yet. Share the code.")}
              </p>
            ) : (
              <div className="space-y-2">
                {detail.roster.map((r, i) => (
                  <div key={r.user_id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <span className="text-sm font-black text-neutral-400 w-5">{i + 1}</span>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {r.profile_picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.profile_picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        r.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{r.name}</p>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><BookMarked className="w-3 h-3" />{r.lessons_completed}</span>
                        <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-amber-500" />{r.weekly_xp}</span>
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" />{r.streak_days}</span>
                        {r.active_today && <span className="text-emerald-500 font-semibold">● {tr(lang, "bugun faol", "активен сегодня", "active today")}</span>}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm(tr(lang, `${r.name}ni o'chirasizmi?`, `Удалить ${r.name}?`, `Remove ${r.name}?`))) {
                          await removeMember(detail.id, r.user_id);
                          openClass(detail.id);
                        }
                      }}
                      className="text-neutral-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div>
            <p className="text-sm font-bold mb-2">{tr(lang, "Vazifalar", "Задания", "Assignments")}</p>
            <div className="space-y-2 mb-3">
              {detail.assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                  <span className="text-sm font-semibold flex-1">{a.title}</span>
                  {a.due_date && <span className="text-[11px] text-neutral-500">{a.due_date}</span>}
                  <button
                    onClick={async () => {
                      await deleteAssignment(detail.id, a.id);
                      openClass(detail.id);
                    }}
                    className="text-neutral-300 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder={tr(lang, "Vazifa nomi", "Название задания", "Assignment title")}
                className="flex-1 min-w-[160px] px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm outline-none focus:border-emerald-500"
              />
              <select
                value={assignSubject}
                onChange={(e) => setAssignSubject(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm outline-none"
              >
                <option value="">{tr(lang, "Fan (ixtiyoriy)", "Предмет (опц.)", "Subject (optional)")}</option>
                {subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>{subjName(lang, s)}</option>
                ))}
              </select>
              <button onClick={doAssign} disabled={busy} className="px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 text-sm disabled:opacity-60">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Class list + create/join ──────────────────────────────────────────────────
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> {tr(lang, "Orqaga", "Назад", "Back")}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-6 h-6 text-indigo-500" />
        <h2 className="text-lg font-extrabold">{tr(lang, "Sinf rejimi", "Классы", "Classes")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="max-w-lg space-y-6">
          {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>}

          {detailLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>}

          {/* Teaching */}
          {teaching.length > 0 && (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 mb-2">{tr(lang, "Men o'qituvchi", "Я преподаю", "I teach")}</p>
              <div className="space-y-2">
                {teaching.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openClass(c.id)}
                    className="w-full flex items-center gap-3 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 p-3 text-left hover:border-indigo-400"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{c.name}</p>
                      <p className="text-[11px] text-neutral-500">{c.member_count} {tr(lang, "o'quvchi", "учеников", "students")} · {tr(lang, "kod", "код", "code")} {c.join_code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enrolled */}
          {enrolled.length > 0 && (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 mb-2">{tr(lang, "Men o'quvchi", "Я учусь", "I'm enrolled")}</p>
              <div className="space-y-2">
                {enrolled.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                      <BookMarked className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{c.name}</p>
                      <p className="text-[11px] text-neutral-500">{tr(lang, "O'qituvchi", "Учитель", "Teacher")}: {c.teacher_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create a class */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm font-bold mb-2">{tr(lang, "Yangi sinf ochish", "Создать класс", "Open a class")}</p>
            <div className="space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tr(lang, "Sinf nomi (masalan: 11-A)", "Название класса", "Class name")}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm outline-none"
                >
                  <option value="">{tr(lang, "Fan (ixtiyoriy)", "Предмет (опц.)", "Subject (optional)")}</option>
                  {subjects.map((s) => (
                    <option key={s.slug} value={s.slug}>{subjName(lang, s)}</option>
                  ))}
                </select>
                <button onClick={doCreate} disabled={busy} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 text-sm disabled:opacity-60">
                  {tr(lang, "Yaratish", "Создать", "Create")}
                </button>
              </div>
            </div>
          </div>

          {/* Join a class */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm font-bold mb-2">{tr(lang, "Sinfga qo'shilish", "Вступить в класс", "Join a class")}</p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent uppercase tracking-widest font-bold text-sm outline-none focus:border-emerald-500"
              />
              <button onClick={doJoin} disabled={busy} className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 text-sm disabled:opacity-60">
                {tr(lang, "Qo'shilish", "Вступить", "Join")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
