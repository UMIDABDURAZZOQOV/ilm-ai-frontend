"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  animate,
  type Variants,
} from "framer-motion";
import { useI18n } from "@/hooks/useI18n";
import type { TranslationKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Brain,
  MessageSquare,
  GraduationCap,
  Calendar,
  Zap,
  Globe,
  Building2,
  Trophy,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import ProductDemos from "@/components/landing/ProductDemos";
import ParticleBackground from "@/components/landing/ParticleBackground";
import Tilt from "react-parallax-tilt";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function TiltMockup({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 20 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="perspective-1000 animate-float">
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current!.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    ref.current!.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      onMouseMove={handleMove}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`spotlight-card group ${className}`}
    >
      {children}
    </motion.div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  green: { bg: "bg-green-500/10", text: "text-green-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-500" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-500" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-500" },
};

const MARQUEE_ITEMS = ["SAT", "IELTS", "TOEFL", "Fanlar"];

export default function LandingPage() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll while the mobile menu overlay is open — otherwise the
  // page scrolls behind it and the menu appears to slide away.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const features: {
    icon: typeof MessageSquare;
    color: string;
    titleKey: TranslationKey;
    descKey: TranslationKey;
    href?: string;
  }[] = [
    { icon: MessageSquare, color: "blue", titleKey: "svc_chat_title", descKey: "svc_chat_desc" },
    { icon: GraduationCap, color: "green", titleKey: "svc_quiz_title", descKey: "svc_quiz_desc" },
    { icon: Calendar, color: "purple", titleKey: "svc_plan_title", descKey: "svc_plan_desc" },
    { icon: Brain, color: "pink", titleKey: "svc_gaps_title", descKey: "svc_gaps_desc" },
    { icon: Globe, color: "yellow", titleKey: "svc_lang_title", descKey: "svc_lang_desc" },
    { icon: GraduationCap, color: "indigo", titleKey: "svc_sat_title", descKey: "svc_sat_desc", href: "/sat" },
    { icon: Building2, color: "teal", titleKey: "svc_college_title", descKey: "svc_college_desc", href: "/sat/college" },
    { icon: Trophy, color: "green", titleKey: "svc_milliy_title", descKey: "svc_milliy_desc", href: "/skills" },
  ];

  const heroWords = t("hero_title").split(" ");

  return (
    <div className="relative overflow-x-hidden pt-[72px]">
      {/* Fixed nav (pinned to top); pt-[72px] above offsets its height */}
      <div className={`nav-sticky ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              <div className="logo-mark">
                <img src="/logo-icon.png" alt="Ilm AI" />
              </div>
              <span>{t("brand")}</span>
            </Link>
            <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>{t("nav_about")}</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>{t("nav_features")}</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)}>{t("nav_how")}</a>
              <LanguageSwitcher />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>{t("nav_login")}</Link>
              <Link href="/signup" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>{t("nav_signup")}</Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* ================= HERO ================= */}
      <section className="relative pt-14 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <ParticleBackground />
        <div className="blob w-[420px] h-[420px] -top-32 -left-32 bg-indigo-500/40" />
        <div className="blob w-[380px] h-[380px] top-10 -right-24 bg-fuchsia-500/30" style={{ animationDelay: "-6s" }} />
        <div className="blob w-[320px] h-[320px] bottom-0 left-1/3 bg-cyan-400/20" style={{ animationDelay: "-11s" }} />

        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.span
              variants={fadeUp}
              className="shimmer-badge inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-sm font-semibold"
              style={{
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "var(--hero-badge-text)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              {t("tagline")}
            </motion.span>

            <h1 className="font-black tracking-tight leading-[1.1] text-[clamp(2.1rem,6vw,3.75rem)] mb-6">
              {heroWords.map((word, i) => (
                <motion.span
                  key={i}
                  variants={fadeUp}
                  className="inline-block mr-[0.28em] gradient-text-anim"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p variants={fadeUp} className="text-lg mb-10" style={{ color: "var(--muted)" }}>
              {t("hero_sub")}
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-4 justify-center flex-wrap mb-16">
              <Link href="/signup" className="btn btn-primary glow-btn group">
                {t("hero_cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#about" className="btn btn-ghost">{t("hero_secondary")}</a>
            </motion.div>
          </motion.div>

          {/* Floating product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="relative max-w-xl mx-auto mt-4"
          >
            <TiltMockup>
              <div
                className="rounded-3xl p-5 sm:p-6 shadow-2xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Ilm AI
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-snug"
                    style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                  >
                    {t("hero_mock_msg")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-5 ml-11">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 typing-dot" style={{ animationDelay: "0s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 typing-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 typing-dot" style={{ animationDelay: "0.4s" }} />
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                    <span>SAT Prep</span>
                    <span><Counter to={78} suffix="%" /></span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 0.78 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                      style={{ transformOrigin: "left", background: "linear-gradient(90deg, var(--primary), var(--primary-2))" }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold leading-none">1480</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>SAT</div>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                      <Target className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold leading-none">7.5</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>IELTS</div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltMockup>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6, type: "spring" }}
              className="animate-float-slow absolute -top-6 -right-4 sm:-right-10 rounded-2xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold">12 {t("streak_label")}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.25, duration: 0.6, type: "spring" }}
              className="animate-float-delay absolute -bottom-6 -left-4 sm:-left-10 rounded-2xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-bold">92% {t("gaps_mastered")}</span>
            </motion.div>
          </motion.div>

          {/* Trust marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-24 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--muted)" }}>
              {t("hero_trust_label")}
            </p>
            <div className="marquee-wrap">
              <div className="marquee-track">
                {[...Array(2)].flatMap(() => [
                  ...MARQUEE_ITEMS,
                  t("marquee_college"),
                  t("marquee_tutor"),
                  t("svc_lang_title"),
                ]).map((item, i) => (
                  <span
                    key={i}
                    className="shrink-0 text-sm font-bold px-5 py-2 rounded-full"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="relative">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-3 gap-4 sm:gap-8 rounded-3xl px-6 py-10 sm:py-12"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <motion.div variants={fadeUp} className="text-center">
              <div className="text-3xl sm:text-5xl font-black gradient-text-anim">
                <Counter to={6000} suffix="+" />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--muted)" }}>{t("stat_universities_label")}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="text-center border-x" style={{ borderColor: "var(--border)" }}>
              <div className="text-3xl sm:text-5xl font-black gradient-text-anim">24/7</div>
              <p className="mt-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--muted)" }}>{t("stat_ai_label")}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="text-center">
              <div className="text-3xl sm:text-5xl font-black gradient-text-anim">
                <Counter to={3} />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--muted)" }}>{t("stat_languages_label")}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= PRODUCT DEMOS ================= */}
      <ProductDemos />

      {/* ================= ABOUT ================= */}
      <section className="section" id="about">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-left"
            >
              <h2 className="text-3xl sm:text-4xl font-black mb-6 tracking-tight">{t("about_title")}</h2>
              <div className="space-y-4 leading-relaxed" style={{ color: "var(--muted)" }}>
                <p>{t("about_p1")}</p>
                <p>{t("about_p2")}</p>
                <p>{t("about_p3")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="relative"
            >
              <div
                className="aspect-square max-w-sm mx-auto rounded-3xl flex items-center justify-center p-10 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))", border: "1px solid var(--border)" }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="82" fill="none" stroke="var(--border)" strokeWidth="14" />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="82"
                    fill="none"
                    stroke="url(#ringGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 0.92 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--primary-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-black">
                    <Counter to={92} suffix="%" />
                  </span>
                  <span className="text-xs font-semibold mt-1" style={{ color: "var(--muted)" }}>{t("about_badge_title")}</span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, type: "spring" }}
                className="animate-float-slow absolute -bottom-6 -right-2 sm:-right-6 p-5 rounded-2xl shadow-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/15 rounded-full flex items-center justify-center text-green-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{t("about_badge_title")}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{t("about_badge_sub")}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="section" id="features">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            {t("services_title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-sub"
          >
            {t("services_sub")}
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid-3"
          >
            {features.map((f, i) => {
              const colors = COLOR_MAP[f.color];
              const Icon = f.icon;
              const content = (
                <>
                  <div className={`h-12 w-12 ${colors.bg} rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <h3 className="flex items-center gap-2">
                    {t(f.titleKey)}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p>{t(f.descKey)}</p>
                </>
              );
              const tilted = (
                <Tilt
                  tiltMaxAngleX={6}
                  tiltMaxAngleY={6}
                  scale={1.02}
                  transitionSpeed={1600}
                  glareEnable
                  glareMaxOpacity={0.12}
                  glareColor="#a5b4fc"
                  glarePosition="all"
                  className="h-full [transform-style:preserve-3d]"
                >
                  <SpotlightCard className="card h-full">{content}</SpotlightCard>
                </Tilt>
              );
              return f.href ? (
                <Link key={i} href={f.href} style={{ textDecoration: "none" }}>
                  {tilted}
                </Link>
              ) : (
                <div key={i}>{tilted}</div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="section" id="how">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            {t("nav_how")}
          </motion.h2>

          <div className="relative">
            <div className="hidden sm:block absolute top-6 left-[16.5%] right-[16.5%] h-0.5 overflow-hidden" style={{ background: "var(--border)" }}>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "left", background: "linear-gradient(90deg, var(--primary), var(--primary-2))" }}
                className="h-full w-full"
              />
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="steps relative"
            >
              {[t("how_1"), t("how_2"), t("how_3")].map((text, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 24, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
                  }}
                  className="step"
                >
                  <div className="step-num">{i + 1}</div>
                  <p>{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl px-8 py-16 sm:py-20 text-center"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
          >
            <div className="blob w-72 h-72 -top-20 -left-10 bg-white/20" />
            <div className="blob w-72 h-72 -bottom-24 -right-10 bg-white/10" style={{ animationDelay: "-8s" }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">{t("final_cta_title")}</h2>
              <p className="text-white/85 max-w-xl mx-auto mb-9">{t("final_cta_sub")}</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl shadow-xl transition-transform hover:scale-105 hover:shadow-2xl"
              >
                {t("hero_cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="mb-6 flex justify-center gap-8 flex-wrap">
            <a href="#about" className="transition-colors">{t("nav_about")}</a>
            <a href="#features" className="transition-colors">{t("nav_features")}</a>
            <a href="mailto:yaktusecho9@gmail.com" className="transition-colors">{t("footer_contact")}</a>
          </div>
          <p className="mb-2">{t("footer_copyright")}</p>
          <p className="text-slate-500 text-xs">{t("footer_note")}</p>
        </div>
      </footer>
    </div>
  );
}
