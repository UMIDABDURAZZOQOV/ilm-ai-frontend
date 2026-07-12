"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  BookOpen,
  Timer,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Loader2,
  GraduationCap,
  ClipboardCheck,
  Layers,
  BookText,
  PenLine,
  Mic,
  Headphones,
  Building2,
  Bookmark,
  Calculator,
  ChevronDown,
  Check,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { href: string; label: string; icon: typeof Home; exact: boolean };

const SAT_NAV: NavItem[] = [
  { href: "/sat", label: "Home", icon: Home, exact: true },
  { href: "/sat/assistant", label: "AI Tutor", icon: Sparkles, exact: false },
  { href: "/sat/bank", label: "Question Bank", icon: BookOpen, exact: false },
  { href: "/sat/vocab", label: "Vocabulary", icon: Layers, exact: false },
  { href: "/sat/mock", label: "Mock Tests", icon: Timer, exact: false },
  { href: "/sat/official", label: "Official Tests", icon: ClipboardCheck, exact: false },
  { href: "/sat/calculator", label: "Score Calculator", icon: Calculator, exact: false },
  { href: "/sat/analytics", label: "Analytics", icon: BarChart3, exact: false },
];

const IELTS_NAV: NavItem[] = [
  { href: "/sat/ielts", label: "Overview", icon: GraduationCap, exact: true },
  { href: "/sat/ielts/reading", label: "Reading", icon: BookText, exact: false },
  { href: "/sat/ielts/writing", label: "Writing", icon: PenLine, exact: false },
  { href: "/sat/ielts/speaking", label: "Speaking", icon: Mic, exact: false },
  { href: "/sat/ielts/listening", label: "Listening", icon: Headphones, exact: false },
  { href: "/sat/ielts/calculator", label: "Score Calculator", icon: Calculator, exact: false },
];

const COLLEGE_NAV: NavItem[] = [
  { href: "/sat/college", label: "Browse Colleges", icon: Building2, exact: false },
];

const PLATFORMS = [
  { id: "sat", label: "SAT", sub: "Digital SAT prep", href: "/sat", icon: GraduationCap, nav: SAT_NAV },
  { id: "ielts", label: "IELTS", sub: "All four skills", href: "/sat/ielts", icon: BookText, nav: IELTS_NAV },
  { id: "college", label: "College App", sub: "US universities", href: "/sat/college", icon: Building2, nav: COLLEGE_NAV },
] as const;

export default function SatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  // Close overlays whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setSwitcherOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // The exam session runs full-screen without the sidebar chrome.
  if (pathname?.startsWith("/sat/session")) {
    return <>{children}</>;
  }

  const platform =
    pathname?.startsWith("/sat/college")
      ? PLATFORMS[2]
      : pathname?.startsWith("/sat/ielts")
      ? PLATFORMS[1]
      : PLATFORMS[0];
  const NAV = platform.nav;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-[#0d3b4f] text-white border-b border-white/10">
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-amber-400" />
          <span className="font-black">Ilm AI <span className="text-white/50 font-semibold text-xs uppercase tracking-widest">{platform.label}</span></span>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — drawer on mobile, fixed rail on desktop */}
      <aside
        className={`w-60 shrink-0 bg-gradient-to-b from-[#0d3b4f] to-[#0a2e3e] text-white flex flex-col fixed inset-y-0 left-0 z-50 border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white z-10"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand */}
        <div className="p-4 pb-2 flex items-center gap-2.5">
          <div className="h-9 w-9 bg-amber-400/15 ring-1 ring-amber-400/20 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-amber-400" />
          </div>
          <p className="font-black leading-tight">Ilm AI</p>
        </div>

        {/* Platform switcher */}
        <div className="px-3 relative">
          <button
            onClick={() => setSwitcherOpen((s) => !s)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
          >
            <platform.icon className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left font-bold text-sm">{platform.label}</span>
            <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
          </button>
          {switcherOpen && (
            <div className="absolute left-3 right-3 mt-2 z-20 rounded-xl bg-[#0a2e3e] border border-white/10 shadow-2xl overflow-hidden">
              {PLATFORMS.map((p) => {
                const active = p.id === platform.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSwitcherOpen(false); router.push(p.href); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <p.icon className={`h-4 w-4 shrink-0 ${active ? "text-amber-400" : "text-white/60"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{p.label}</p>
                      <p className="text-[11px] text-white/45">{p.sub}</p>
                    </div>
                    {active && <Check className="h-4 w-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-3 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-400" />
                )}
                <item.icon className={`h-4 w-4 transition-colors ${active ? "text-amber-400" : "group-hover:text-amber-400/70"}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-400/90 text-[#0d3b4f] flex items-center justify-center font-black text-sm overflow-hidden">
            {user.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_picture} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0) || "U"
            )}
          </div>
          <p className="text-sm font-semibold truncate">{user.name}</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 lg:ml-60 min-h-screen pt-14 lg:pt-0 overflow-x-hidden min-w-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
