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
  Building2,
  Calculator,
  ChevronDown,
  Check,
  Menu,
  X,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import FocusTimerWidget from "@/components/ui/FocusTimerWidget";

type NavItem = { href: string; label: string; icon: typeof Home; exact: boolean; group?: string };

const SAT_NAV: NavItem[] = [
  { href: "/sat", label: "Home", icon: Home, exact: true },
  { href: "/sat/assistant", label: "Ask AI", icon: Sparkles, exact: false },
  { href: "/sat/bank", label: "Question Bank", icon: BookOpen, exact: false, group: "PRACTICE" },
  { href: "/sat/vocab", label: "Vocabulary", icon: Layers, exact: false, group: "PRACTICE" },
  { href: "/sat/mock", label: "Mock Tests", icon: Timer, exact: false, group: "PRACTICE" },
  { href: "/sat/official", label: "Official Tests", icon: ClipboardCheck, exact: false, group: "PRACTICE" },
  { href: "/sat/calculator", label: "Score Calculator", icon: Calculator, exact: false, group: "PROGRESS" },
  { href: "/sat/analytics", label: "Analytics", icon: BarChart3, exact: false, group: "PROGRESS" },
];

// The four skills are deliberately NOT listed here. A skill only means anything
// inside a test — you sit "Test 3 Reading", not "reading" — so they are reached from
// the test cards on /sat/ielts, which carry ?test= through. Listing them twice let a
// learner open a skill detached from any test.
const IELTS_NAV: NavItem[] = [
  { href: "/sat/ielts", label: "Tests", icon: GraduationCap, exact: true },
  { href: "/sat/ielts/dictionary", label: "Dictionary", icon: BookText, exact: false, group: "PRACTICE" },
  { href: "/sat/ielts/calculator", label: "Score Calculator", icon: Calculator, exact: false, group: "PROGRESS" },
];

const COLLEGE_NAV: NavItem[] = [
  { href: "/sat/college", label: "Browse Colleges", icon: Building2, exact: false },
];

const PLATFORMS = [
  { id: "sat", label: "SAT", sub: "Digital SAT prep", href: "/sat", icon: GraduationCap, nav: SAT_NAV },
  { id: "ielts", label: "IELTS", sub: "All four skills", href: "/sat/ielts", icon: BookText, nav: IELTS_NAV },
  { id: "college", label: "College App", sub: "US universities", href: "/sat/college", icon: Building2, nav: COLLEGE_NAV },
  { id: "skills", label: "Fanlar", sub: "Ona tili, Tarix va boshqalar", href: "/skills", icon: Trophy, nav: [] },
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

  // The SAT section now follows the app's global light/dark theme. Its light-mode
  // utilities (bg-white, text-slate-*, the #0d3b4f teal, op-* palette) are remapped
  // to dark values via the `.dark .sat-scope { … }` block in globals.css.

  useEffect(() => {
    setMobileOpen(false);
    setSwitcherOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="sat-scope min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-op-blue" />
      </div>
    );
  }

  // The exam session runs full-screen without the sidebar chrome.
  if (pathname?.startsWith("/sat/session")) {
    return <div className="sat-scope font-manrope">{children}</div>;
  }

  const platform =
    pathname?.startsWith("/sat/college")
      ? PLATFORMS[2]
      : pathname?.startsWith("/sat/ielts")
      ? PLATFORMS[1]
      : PLATFORMS[0];
  const NAV = platform.nav;

  // Group nav items into ungrouped (top) + labelled sections, in first-seen order.
  const groups: { label: string | null; items: NavItem[] }[] = [];
  for (const item of NAV) {
    const key = item.group ?? null;
    let g = groups.find((x) => x.label === key);
    if (!g) { g = { label: key, items: [] }; groups.push(g); }
    g.items.push(item);
  }

  const renderLink = (item: NavItem) => {
    const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-bold transition-colors ${
          active ? "bg-op-tealDark text-white" : "text-op-tealText/90 hover:bg-op-tealHover"
        }`}
      >
        <item.icon className={`h-[18px] w-[18px] ${active ? "text-white" : "text-op-tealMuted group-hover:text-white"}`} />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  const sidebar = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-2.5">
        <div className="h-[30px] w-[30px] rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="font-extrabold text-[19px] text-white tracking-tight">Ilm AI</span>
      </div>

      {/* Platform switcher (styled like OnePrep's "SAT ▾" chip) */}
      <div className="relative mb-2">
        <button
          onClick={() => setSwitcherOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[10px] bg-op-tealDark border border-op-tealBorder text-white font-extrabold text-[14px]"
        >
          <span className="flex items-center gap-2"><platform.icon className="h-4 w-4 text-op-tealMuted" /> {platform.label}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-op-tealMuted transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
        </button>
        {switcherOpen && (
          <div className="absolute left-0 right-0 mt-2 z-20 rounded-xl bg-white border border-op-line shadow-2xl overflow-hidden">
            {PLATFORMS.map((p) => {
              const active = p.id === platform.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSwitcherOpen(false); router.push(p.href); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${active ? "bg-op-sky" : "hover:bg-op-panel"}`}
                >
                  <p.icon className={`h-4 w-4 shrink-0 ${active ? "text-op-blue" : "text-op-faint"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-op-ink leading-tight">{p.label}</p>
                    <p className="text-[11px] text-op-muted">{p.sub}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-op-blue shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {groups.map((g, gi) => (
          <div key={gi} className={g.label ? "pt-2" : ""}>
            {g.label && (
              <div className="text-[11px] font-extrabold tracking-[0.1em] text-op-tealMuted px-3 pt-2 pb-1">{g.label}</div>
            )}
            <div className="space-y-1">{g.items.map(renderLink)}</div>
          </div>
        ))}

        <div className="pt-3 mt-3 border-t border-op-tealBorder space-y-1">
          <Link href="/dashboard" className="group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-bold text-op-tealText/90 hover:bg-op-tealHover transition-colors">
            <Sparkles className="h-[18px] w-[18px] text-op-tealMuted group-hover:text-white" /> AI Assistant
          </Link>
          <Link href="/dashboard" className="group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-bold text-op-tealText/90 hover:bg-op-tealHover transition-colors">
            <ArrowLeft className="h-[18px] w-[18px] text-op-tealMuted group-hover:text-white" /> Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="mt-auto pt-3 border-t border-op-tealBorder flex items-center gap-2.5 px-1">
        <div className="h-7 w-7 rounded-full bg-[#8BC34A] text-white flex items-center justify-center font-extrabold text-[12px] overflow-hidden shrink-0">
          {user.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_picture} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            user.name?.charAt(0) || "U"
          )}
        </div>
        <span className="flex-1 text-[13.5px] font-bold text-op-tealText truncate">{user.name}</span>
      </div>
    </>
  );

  return (
    <div className="sat-scope min-h-screen flex bg-white text-op-ink font-manrope">
      <FocusTimerWidget />
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-op-teal text-white">
        <button onClick={() => setMobileOpen(true)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-white" />
          <span className="font-extrabold">Ilm AI <span className="text-op-tealMuted font-bold text-xs uppercase tracking-widest">{platform.label}</span></span>
        </div>
        <ThemeToggle className="ml-auto" />
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`w-[252px] shrink-0 bg-op-teal text-op-tealText flex flex-col p-3 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setMobileOpen(false)} className="lg:hidden absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white z-10" aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
        {sidebar}
      </aside>

      {/* Content */}
      <main className="flex-1 lg:ml-[252px] min-h-screen pt-14 lg:pt-0 overflow-x-hidden min-w-0 bg-white">
        <div className="max-w-[1100px] mx-auto px-5 py-7 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
