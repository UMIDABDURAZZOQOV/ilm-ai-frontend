"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getProgress, type SubjectProgress } from "@/lib/skillTreeApi";
import ThemeToggle from "@/components/ThemeToggle";

/** A subject's mastery ring — colour by band so weak subjects read at a glance. */
function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-200 dark:text-neutral-800" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 font-black" style={{ fontSize: 15 }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

const band = (p: number) => (p >= 75 ? "#22c55e" : p >= 45 ? "#f59e0b" : "#ef4444");

export default function ProgressDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<SubjectProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    getProgress(user.id)
      .then((r) => setRows(r.subjects))
      .catch(() => setError("Progressni yuklab bo'lmadi."));
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen grid place-items-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const started = rows?.filter((r) => r.attempted > 0) ?? [];
  const overall = started.length
    ? Math.round(started.reduce((s, r) => s + r.mastery_pct, 0) / started.length)
    : 0;
  const weakest = [...started].sort((a, b) => a.mastery_pct - b.mastery_pct).slice(0, 3);

  return (
    <div className="sat-scope min-h-screen bg-white dark:bg-neutral-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/skills" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Fanlar
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="text-3xl font-black flex items-center gap-3 mb-1">
          <TrendingUp className="h-7 w-7 text-emerald-500" /> Mening progressim
        </h1>
        <p className="text-slate-500 mb-6">Har bir fan bo'yicha o'zlashtirish darajasi va kuchsiz mavzular.</p>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!rows && !error && (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        )}

        {rows && (
          <>
            {/* summary strip */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 text-center">
                <div className="text-3xl font-black" style={{ color: band(overall) }}>{overall}%</div>
                <div className="text-xs text-slate-500 mt-1">O'rtacha o'zlashtirish</div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 text-center">
                <div className="text-3xl font-black">{started.length}<span className="text-lg text-slate-400">/{rows.length}</span></div>
                <div className="text-xs text-slate-500 mt-1">Boshlangan fanlar</div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 text-center">
                <div className="text-3xl font-black">{rows.reduce((s, r) => s + r.completed, 0)}</div>
                <div className="text-xs text-slate-500 mt-1">Tugatilgan darslar</div>
              </div>
            </div>

            {/* weak areas across all subjects */}
            {weakest.length > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 mb-6">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Diqqat talab qiladigan fanlar
                </div>
                <div className="flex flex-wrap gap-2">
                  {weakest.map((r) => (
                    <Link key={r.slug} href={`/skills?subject=${r.slug}`}
                      className="text-sm font-semibold rounded-lg bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/50 px-3 py-1.5 hover:shadow-sm">
                      {r.name_uz} · <span style={{ color: band(r.mastery_pct) }}>{Math.round(r.mastery_pct)}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* per-subject cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {rows.map((r) => (
                <Link key={r.slug} href={`/skills?subject=${r.slug}`}
                  className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 flex gap-4 hover:shadow-md transition-shadow">
                  <Ring pct={r.attempted ? r.mastery_pct : 0} color={r.color || band(r.mastery_pct)} />
                  <div className="flex-1 min-w-0">
                    <div className="font-black truncate">{r.name_uz}</div>
                    <div className="text-xs text-slate-500 mb-2">
                      {r.completed}/{r.total_lessons} dars tugatilgan
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.progress_pct}%`, background: r.color || "#22c55e" }} />
                    </div>
                    {r.weak_units.length > 0 && r.attempted > 0 && (
                      <div className="text-[11px] text-slate-400 mt-2 truncate">
                        Kuchsiz: {r.weak_units.map((u) => u.title_uz).join(", ")}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
