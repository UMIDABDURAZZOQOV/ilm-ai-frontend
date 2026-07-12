"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Search, Bookmark, SlidersHorizontal, MapPin, X, Globe2, Loader2 } from "lucide-react";
import { collegeCountry, collegeRegion, type College } from "@/lib/colleges";
import { loadColleges } from "@/lib/collegesData";
import { CollegeLogo } from "./CollegeLogo";

const SAVED_KEY = "college_saved";

function readSaved(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

const REGIONS = [
  { id: "all", label: "All regions" },
  { id: "US", label: "🇺🇸 United States" },
  { id: "Europe", label: "🇪🇺 Europe" },
] as const;

const ACC_BANDS = [
  { key: "u25", label: "Under 25%", test: (r: number) => r < 25 },
  { key: "25-50", label: "25–50%", test: (r: number) => r >= 25 && r <= 50 },
  { key: "50+", label: "50%+", test: (r: number) => r > 50 },
];

// Selectivity score computed from public stats (lower acceptance + higher SAT =
// more selective). Not a copyrighted ranking — derived from College Scorecard.
function selectivity(c: College): number {
  const sat = c.medianSAT ?? 0;
  const acc = c.acceptanceRate;
  const accPart = acc != null ? (100 - acc) * 5 : 0;
  const nobelPart = (c.nobelAffiliated ?? 0) * 3;
  return sat + accPart + nobelPart;
}

export default function CollegeBrowsePage() {
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [schoolType, setSchoolType] = useState<"All" | "Public" | "Private Nonprofit">("All");
  const [accBand, setAccBand] = useState<string | null>(null);
  const [sort, setSort] = useState<"top" | "name" | "acc" | "sat">("top");
  const [region, setRegion] = useState<"all" | "US" | "Europe">("all");
  const [country, setCountry] = useState<string>("All");
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  // Render in pages — the full directory is ~6000 entries, so rendering all at
  // once (each an animated card) froze the page for minutes. Show a chunk and
  // let the user load more.
  const PAGE = 48;
  const [visible, setVisible] = useState(PAGE);

  const countries = useMemo(() => {
    const set = new Set(
      colleges.filter((c) => region === "all" || collegeRegion(c) === region).map(collegeCountry)
    );
    return ["All", ...Array.from(set).sort()];
  }, [region, colleges]);

  useEffect(() => { setSaved(readSaved()); }, []);
  useEffect(() => {
    loadColleges().then(setColleges).finally(() => setLoading(false));
  }, []);
  // Any filter/search change starts the list back at the first page.
  useEffect(() => { setVisible(PAGE); }, [query, region, country, schoolType, accBand, sort, tab]);

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { window.localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = colleges.filter((c) => {
      if (tab === "saved" && !saved.includes(c.id)) return false;
      if (region !== "all" && collegeRegion(c) !== region) return false;
      if (country !== "All" && collegeCountry(c) !== country) return false;
      if (schoolType !== "All" && c.type !== schoolType) return false;
      if (accBand) {
        const band = ACC_BANDS.find((b) => b.key === accBand);
        if (band && (c.acceptanceRate == null || !band.test(c.acceptanceRate))) return false;
      }
      if (q && !c.name.toLowerCase().includes(q) && !(c.aka || "").toLowerCase().includes(q) && !c.city.toLowerCase().includes(q)) return false;
      return true;
    });
    const num = (v: number | undefined, fallback: number) => (v == null ? fallback : v);
    list = [...list].sort((a, b) => {
      if (sort === "top") return selectivity(b) - selectivity(a);
      if (sort === "acc") return num(a.acceptanceRate, 999) - num(b.acceptanceRate, 999);
      if (sort === "sat") return num(b.medianSAT, -1) - num(a.medianSAT, -1);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [colleges, tab, saved, query, schoolType, accBand, sort, region, country]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-[#0d3b4f] dark:text-amber-400" /> Browse Colleges
        </h1>
        <p className="text-slate-500 mt-1">Compare US and European universities — admission stats, SAT scores, and famous faculty.</p>
      </div>

      {/* Region selector: US vs Europe */}
      <div className="flex w-full sm:w-auto sm:inline-flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 gap-1">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => { setRegion(r.id); setCountry("All"); }}
            className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              region === r.id ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 gap-1">
          <button onClick={() => setTab("all")} className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "all" ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}>All Colleges</button>
          <button onClick={() => setTab("saved")} className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "saved" ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}><Bookmark className="h-3.5 w-3.5" /> Saved</button>
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${showFilters ? "border-[#0d3b4f] dark:border-amber-400 text-[#0d3b4f] dark:text-amber-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
          <SlidersHorizontal className="h-4 w-4" /> Sort & filter
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search colleges…" className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-[#0d3b4f] dark:focus:border-amber-400" />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none">
              <option value="top">⭐ Top / most selective</option>
              <option value="name">Name (A–Z)</option>
              <option value="acc">Acceptance rate (low→high)</option>
              <option value="sat">Median SAT (high→low)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> Country</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none max-w-[180px]">
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Type</span>
            {(["All", "Public", "Private Nonprofit"] as const).map((t) => (
              <button key={t} onClick={() => setSchoolType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${schoolType === t ? "border-[#0d3b4f] dark:border-amber-400 text-[#0d3b4f] dark:text-amber-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{t === "Private Nonprofit" ? "Private" : t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Acceptance</span>
            {ACC_BANDS.map((b) => (
              <button key={b.key} onClick={() => setAccBand(accBand === b.key ? null : b.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${accBand === b.key ? "border-[#0d3b4f] dark:border-amber-400 text-[#0d3b4f] dark:text-amber-400" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>{b.label}</button>
            ))}
          </div>
          {(schoolType !== "All" || accBand || sort !== "top") && (
            <button onClick={() => { setSchoolType("All"); setAccBand(null); setSort("top"); }} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#0d3b4f] dark:text-amber-400" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-12">{tab === "saved" ? "You haven't saved any colleges yet." : "No colleges match your search."}</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.slice(0, visible).map((c, i) => (
              <CollegeCard key={c.id} college={c} saved={saved.includes(c.id)} onToggle={() => toggleSave(c.id)} delay={Math.min(i, 11) * 0.03} />
            ))}
          </div>
          {filtered.length > visible && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#0d3b4f] dark:hover:border-amber-400 hover:text-[#0d3b4f] dark:hover:text-amber-400 transition-all"
              >
                Load more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}

      {!loading && (
        <p className="text-xs text-slate-400">
          Showing {Math.min(visible, filtered.length)} of {filtered.length} matching universities — US data from public College Scorecard,
          European universities from the open Hipolabs dataset.
        </p>
      )}
    </div>
  );
}

function CollegeCard({ college: c, saved, onToggle, delay }: { college: College; saved: boolean; onToggle: () => void; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="relative">
      <Link href={`/sat/college/${c.id}`} className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5">
        <div className="flex items-start gap-4">
          <CollegeLogo college={c} className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-lg leading-tight break-words">{c.name}</h3>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.city}, {c.state}</span></p>
            <p className="text-xs text-slate-400 mt-0.5">{c.type}</p>
          </div>
        </div>
        <div className="flex gap-8 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[11px] text-slate-400">Acceptance</p>
            <p className="font-black">{c.acceptanceRate != null ? `${c.acceptanceRate}%` : "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Median SAT</p>
            <p className="font-black">{c.medianSAT ?? "—"}</p>
          </div>
        </div>
      </Link>
      <button onClick={onToggle} aria-label="Save" className={`absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center transition-all ${saved ? "bg-amber-400 text-[#0d3b4f]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"}`}>
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      </button>
    </motion.div>
  );
}
