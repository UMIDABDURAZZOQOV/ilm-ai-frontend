"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Bookmark, Globe, Award, ChevronDown, Building2, Loader2 } from "lucide-react";
import { type College } from "@/lib/colleges";
import { loadCollege } from "@/lib/collegesData";
import { CollegeLogo } from "../CollegeLogo";

const SAVED_KEY = "college_saved";

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 sm:w-40 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, value)}%` }} />
        </div>
        <span className="font-black tabular-nums w-12 text-right">{value}%</span>
      </div>
    </div>
  );
}

function BellCurve({ score, max = 1600, min = 400 }: { score: number; max?: number; min?: number }) {
  const pct = (score - min) / (max - min);
  const x = 10 + pct * 280;
  return (
    <svg viewBox="0 0 300 90" className="w-full h-24">
      <path d="M10,80 C 80,80 110,20 150,20 C 190,20 220,80 290,80" fill="none" stroke="currentColor" className="text-blue-400/30" strokeWidth="2" />
      <path d="M10,80 C 80,80 110,20 150,20 C 190,20 220,80 290,80 L290,82 L10,82 Z" className="fill-blue-400/10" />
      <line x1={x} y1="14" x2={x} y2="82" stroke="currentColor" className="text-blue-500" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx={x} cy="20" r="4" className="fill-blue-500" />
    </svg>
  );
}

const FAQ_ITEMS = (c: College) => [
  { q: `What is the acceptance rate at ${c.name}?`, a: c.acceptanceRate != null
      ? `${c.name} has an acceptance rate of ${c.acceptanceRate}%. This means that out of every 100 applicants, approximately ${Math.round(c.acceptanceRate)} are admitted.`
      : `${c.name} does not publish a single acceptance rate in the US style; admission depends on the specific programme. Check the official website for details.` },
  { q: `What is ${c.name}'s test score policy?`, a: `${c.name}'s standardized-test policy is currently: ${c.testPolicy || "not specified / varies by programme"}. Always confirm the latest policy on the official admissions website before applying.` },
  { q: `What SAT score do I need for ${c.name}?`, a: c.medianSAT
      ? `The median SAT score for admitted students is around ${c.medianSAT}${c.medianACT ? ` (median ACT ${c.medianACT})` : ""}. Aim at or above this to be competitive.`
      : `${c.name} does not typically require the SAT. Entry is based on national qualifications or programme-specific requirements.` },
  { q: `Is ${c.name} public or private?`, a: `${c.name} is a ${c.type} institution located in ${c.city}, ${c.state}.` },
  { q: `How many students attend ${c.name}?`, a: `${c.name} enrolls roughly ${c.size || "N/A"} students.` },
];

export default function CollegeDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [college, setCollege] = useState<College | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"admissions" | "academics" | "students">("admissions");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    loadCollege(id).then((c) => { setCollege(c); setLoading(false); });
    try {
      const arr: string[] = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
      setSaved(arr.includes(id));
    } catch {}
  }, [id]);

  function toggleSave() {
    try {
      const arr: string[] = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      setSaved(next.includes(id));
    } catch {}
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#0d3b4f] dark:text-amber-400" /></div>;
  }

  if (!college) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-500">College not found.</p>
        <Link href="/sat/college" className="text-[#0d3b4f] dark:text-amber-400 font-bold">← Back to Browse Colleges</Link>
      </div>
    );
  }
  const c = college;

  return (
    <div className="space-y-6">
      <Link href="/sat/college" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> Browse Colleges
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <CollegeLogo college={c} className="h-16 w-16 shrink-0 rounded-2xl text-xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">{c.name}</h1>
          <p className="text-sm text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.city}, {c.state}</span>
            {c.aka && <span className="text-slate-300 dark:text-slate-600">·</span>}
            {c.aka && <span>Also known as: {c.aka}</span>}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">{c.type}</span>
            {c.setting && <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">{c.setting}</span>}
          </div>
        </div>
        <button onClick={toggleSave} aria-label="Save" className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all ${saved ? "bg-amber-400 text-[#0d3b4f]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}>
          <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Scores + tabbed stats */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Scores */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h3 className="text-lg font-black">Scores</h3>
          {c.medianSAT ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">SAT · median</p>
                <p className="font-black text-lg">{c.medianSAT}</p>
              </div>
              <BellCurve score={c.medianSAT} />
              <div className="flex justify-between text-[11px] text-slate-400"><span>400</span><span>1600</span></div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">This university does not typically use SAT scores for admission. Check its website for entry requirements.</p>
          )}
          {c.medianACT && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ACT · median</p>
              <p className="font-black text-lg">{c.medianACT}</p>
            </div>
          )}
          <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Globe className="h-4 w-4" /> Visit website
          </a>
        </div>

        {/* Tabbed stats */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex gap-5 border-b border-slate-100 dark:border-slate-800 mb-4">
            {(["admissions", "academics", "students"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-bold capitalize border-b-2 -mb-px transition-all ${tab === t ? "border-[#0d3b4f] dark:border-amber-400 text-slate-900 dark:text-white" : "border-transparent text-slate-400"}`}>{t}</button>
            ))}
          </div>
          {tab === "admissions" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Average GPA</span><span className="font-black">{c.gpa || "N/A"}</span></div>
              {c.acceptanceRate != null ? (
                <StatBar label="Acceptance rate" value={c.acceptanceRate} />
              ) : (
                <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Acceptance rate</span><span className="font-black">N/A</span></div>
              )}
              {c.yieldRate != null && <StatBar label="Yield rate" value={c.yieldRate} />}
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Test scores policy</span><span className="font-black">{c.testPolicy || "N/A"}</span></div>
            </div>
          )}
          {tab === "academics" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Institution type</span><span className="font-black">{c.type}</span></div>
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Nobel-affiliated laureates</span><span className="font-black">{c.nobelAffiliated ?? "—"}</span></div>
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Featured faculty</span><span className="font-black">{c.professors?.length ?? 0}</span></div>
            </div>
          )}
          {tab === "students" && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Undergraduates</span><span className="font-black">{c.size || "N/A"}</span></div>
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Setting</span><span className="font-black">{c.setting || "N/A"}</span></div>
              <div className="flex items-center justify-between py-2.5"><span className="text-sm text-slate-500">Location</span><span className="font-black">{c.city}, {c.state}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Famous professors & Nobel — our addition */}
      {(c.professors?.length || c.nobelAffiliated) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-black flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Famous professors</h3>
            {c.nobelAffiliated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Award className="h-3.5 w-3.5" /> {c.nobelAffiliated} Nobel-affiliated laureates
              </span>
            ) : null}
          </div>
          {c.professors?.length ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {c.professors.map((p) => (
                <div key={p.name} className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-sm">
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.field}</p>
                    {p.note && <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Notable-faculty details for this school are being added.</p>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-lg font-black mb-3">Frequently asked questions</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {FAQ_ITEMS(c).map((item, i) => (
            <div key={i} className="py-1">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 py-3 text-left">
                <span className="text-sm font-semibold">{item.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="text-sm text-slate-500 pb-3 pr-6">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 flex items-start gap-1.5">
        <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Disclaimer: figures are approximate, drawn from public data, and may not be fully current. Always verify on the
        official admissions website before applying.
      </p>
    </div>
  );
}
