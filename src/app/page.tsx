"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { Brain, MessageSquare, GraduationCap, Calendar, Zap, Globe, Building2, Menu, X } from "lucide-react";

export default function LandingPage() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div>
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
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        <header className="hero">
          <span className="hero-badge">✨ {t("tagline")}</span>
          <h1>{t("hero_title")}</h1>
          <p>{t("hero_sub")}</p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary">{t("hero_cta")}</Link>
            <a href="#about" className="btn btn-ghost">{t("hero_secondary")}</a>
          </div>
        </header>

        <section className="section" id="about">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h2 className="text-3xl font-black mb-6 tracking-tight">{t("about_title")}</h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>{t("about_p1")}</p>
                <p>{t("about_p2")}</p>
                <p>{t("about_p3")}</p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl border border-white/10 flex items-center justify-center p-12">
                <Brain className="h-full w-full text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{t("about_badge_title")}</p>
                    <p className="text-xs text-slate-500">{t("about_badge_sub")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <h2 className="section-title">{t("services_title")}</h2>
          <p className="section-sub">{t("services_sub")}</p>
          <div className="grid-3">
            <article className="card">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <h3>{t("svc_chat_title")}</h3>
              <p>{t("svc_chat_desc")}</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="h-6 w-6 text-green-500" />
              </div>
              <h3>{t("svc_quiz_title")}</h3>
              <p>{t("svc_quiz_desc")}</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <h3>{t("svc_plan_title")}</h3>
              <p>{t("svc_plan_desc")}</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-pink-500" />
              </div>
              <h3>{t("svc_gaps_title")}</h3>
              <p>{t("svc_gaps_desc")}</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-yellow-500" />
              </div>
              <h3>{t("svc_lang_title")}</h3>
              <p>{t("svc_lang_desc")}</p>
            </article>
            <Link href="/sat" className="card" style={{ textDecoration: "none" }}>
              <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="h-6 w-6 text-indigo-500" />
              </div>
              <h3>{t("svc_sat_title")}</h3>
              <p>{t("svc_sat_desc")}</p>
            </Link>
            <Link href="/sat/college" className="card" style={{ textDecoration: "none" }}>
              <div className="h-12 w-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-teal-500" />
              </div>
              <h3>{t("svc_college_title")}</h3>
              <p>{t("svc_college_desc")}</p>
            </Link>
          </div>
        </section>

        <section className="section" id="how">
          <h2 className="section-title">{t("nav_how")}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <p>{t("how_1")}</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <p>{t("how_2")}</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <p>{t("how_3")}</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="mb-6 flex justify-center gap-8 flex-wrap">
            <a href="#about" className="transition-colors">{t("nav_about")}</a>
            <a href="#features" className="transition-colors">{t("nav_features")}</a>
            <a href="mailto:yaktusecho9@gmail.com" className="transition-colors">{t("footer_contact")}</a>
          </div>
          <p className="mb-2">{t("footer_copyright")}</p>
          <p className="text-slate-500 text-xs">{t("footer_note")}</p>
        </footer>
      </div>
    </div>
  );
}
