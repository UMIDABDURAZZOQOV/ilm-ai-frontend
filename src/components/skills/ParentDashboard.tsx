"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ArrowLeft, Users, Copy, Check, Flame, Zap, BookMarked, Heart } from "lucide-react";
import {
  getFamilyCode,
  linkChild,
  getChildren,
  unlinkChild,
  type ChildDetail,
  type SubjectProgress,
} from "@/lib/skillTreeApi";

function tr(lang: string, uz: string, ru: string, en: string) {
  return lang === "ru" ? ru : lang === "en" ? en : uz;
}

function subjName(lang: string, s: SubjectProgress) {
  return lang === "ru" ? s.name_ru : lang === "en" ? s.name_en : s.name_uz;
}

function MiniHeatmap({ activity }: { activity: Record<string, number> }) {
  const days: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: activity[key] ?? 0 });
  }
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const shade = (c: number) =>
    c === 0 ? "bg-neutral-100 dark:bg-neutral-800" : c < 2 ? "bg-emerald-300" : c < 4 ? "bg-emerald-500" : "bg-emerald-600";
  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d) => (
            <div key={d.date} className={`w-2.5 h-2.5 rounded-sm ${shade(d.count)}`} title={`${d.date}: ${d.count}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChildCard({ lang, child, onUnlink }: { lang: string; child: ChildDetail; onUnlink: () => void }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-lg font-bold overflow-hidden shrink-0">
          {child.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.profile_picture} alt="" className="h-full w-full object-cover" />
          ) : (
            child.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold truncate">{child.name}</p>
          <p className="text-[11px] text-neutral-500">
            {child.active_today
              ? tr(lang, "Bugun o'qidi ✓", "Занимался сегодня ✓", "Studied today ✓")
              : child.last_active
              ? tr(lang, `Oxirgi faollik: ${child.last_active}`, `Последняя активность: ${child.last_active}`, `Last active: ${child.last_active}`)
              : tr(lang, "Hali boshlamagan", "Ещё не начал", "Not started yet")}
          </p>
        </div>
        <button onClick={onUnlink} className="text-[11px] text-neutral-400 hover:text-red-500 font-semibold">
          {tr(lang, "Uzish", "Отвязать", "Unlink")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, color: "#FFC800", v: child.xp_total, l: "XP" },
          { icon: Flame, color: "#FF9600", v: child.streak_days, l: tr(lang, "kun", "дней", "streak") },
          { icon: BookMarked, color: "#58CC02", v: child.lessons_completed, l: tr(lang, "dars", "уроков", "lessons") },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-2 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-0.5" style={{ color: s.color }} />
            <div className="text-base font-extrabold">{s.v}</div>
            <div className="text-[9px] text-neutral-500">{s.l}</div>
          </div>
        ))}
      </div>

      {(child.strongest || child.weakest) && (
        <div className="flex gap-2 text-[11px]">
          {child.strongest && (
            <div className="flex-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 px-2 py-1.5">
              <span className="text-emerald-500 font-bold">{tr(lang, "Kuchli", "Сильный", "Strong")}: </span>
              {subjName(lang, child.strongest)}
            </div>
          )}
          {child.weakest && child.weakest.slug !== child.strongest?.slug && (
            <div className="flex-1 rounded-xl bg-red-50 dark:bg-red-950 px-2 py-1.5">
              <span className="text-red-500 font-bold">{tr(lang, "Zaif", "Слабый", "Weak")}: </span>
              {subjName(lang, child.weakest)}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-neutral-500 mb-1">{tr(lang, "So'nggi 6 hafta", "Последние 6 недель", "Last 6 weeks")}</p>
        <MiniHeatmap activity={child.activity} />
      </div>
    </div>
  );
}

export default function ParentDashboard({ lang, onBack }: { lang: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildDetail[]>([]);
  const [code, setCode] = useState<string>("");
  const [linkedParents, setLinkedParents] = useState<{ parent_id: number; name: string }[]>([]);
  const [linkCode, setLinkCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getChildren(), getFamilyCode()])
      .then(([c, fc]) => {
        setChildren(c.children);
        setCode(fc.code);
        setLinkedParents(fc.linked_parents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doLink() {
    if (!linkCode.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await linkChild(linkCode.trim());
      setLinkCode("");
      load();
      setMsg({ ok: true, text: r.already ? tr(lang, "Allaqachon bog'langan", "Уже привязан", "Already linked") : tr(lang, `${r.child_name} bilan bog'landingiz`, `Вы привязаны к ${r.child_name}`, `Linked to ${r.child_name}`) });
    } catch (e) {
      const d = (e as { detail?: string })?.detail;
      const map: Record<string, string> = {
        invalid_code: tr(lang, "Kod noto'g'ri", "Неверный код", "Invalid code"),
        self_link: tr(lang, "O'z kodingiz", "Ваш код", "Your own code"),
      };
      setMsg({ ok: false, text: map[d ?? ""] ?? tr(lang, "Xatolik", "Ошибка", "Error") });
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> {tr(lang, "Orqaga", "Назад", "Back")}
      </button>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-6 h-6 text-rose-500" />
        <h2 className="text-lg font-extrabold">{tr(lang, "Ota-ona paneli", "Родительская панель", "Parent dashboard")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="max-w-lg space-y-6">
          {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>}

          {/* Parent: linked children */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-rose-500" />
              <p className="text-sm font-bold">{tr(lang, "Farzandlarim", "Мои дети", "My children")}</p>
            </div>
            {children.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                {tr(lang, "Hali bog'lanmagan. Farzandingizning kodini kiriting.", "Пока никого. Введите код ребёнка.", "None yet. Enter your child's code.")}
              </p>
            ) : (
              <div className="space-y-3">
                {children.map((c) => (
                  <ChildCard
                    key={c.user_id}
                    lang={lang}
                    child={c}
                    onUnlink={async () => {
                      if (confirm(tr(lang, `${c.name}ni uzasizmi?`, `Отвязать ${c.name}?`, `Unlink ${c.name}?`))) {
                        await unlinkChild(c.user_id);
                        load();
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Link a child */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-sm font-bold mb-2">{tr(lang, "Farzandni bog'lash", "Привязать ребёнка", "Link a child")}</p>
            <p className="text-[11px] text-neutral-500 mb-2">
              {tr(lang, "Farzandingiz o'z ilovasidan bergan 6 xonali kodni kiriting.", "Введите 6-значный код из приложения ребёнка.", "Enter the 6-char code from your child's app.")}
            </p>
            <div className="flex gap-2">
              <input
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent uppercase tracking-widest font-bold text-sm outline-none focus:border-rose-500"
              />
              <button onClick={doLink} disabled={busy} className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 text-sm disabled:opacity-60">
                {tr(lang, "Bog'lash", "Привязать", "Link")}
              </button>
            </div>
          </div>

          {/* Student: my code to share with a parent */}
          <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white p-5">
            <p className="text-sm opacity-90 mb-1">{tr(lang, "Ota-onangizga beradigan kodingiz", "Ваш код для родителя", "Your code to share with a parent")}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold tracking-widest">{code}</span>
              <button onClick={copyCode} className="ml-auto bg-white/20 hover:bg-white/30 rounded-xl p-2.5">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {linkedParents.length > 0 && (
              <p className="text-xs opacity-90 mt-3">
                {tr(lang, "Bog'langan:", "Привязан:", "Linked:")} {linkedParents.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
