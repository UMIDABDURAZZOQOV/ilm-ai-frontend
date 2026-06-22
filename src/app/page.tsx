"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

import { BookOpen, Brain, MessageSquare, GraduationCap, Calendar, Zap, Shield, Globe, Users, Menu, X } from "lucide-react";

export default function LandingPage() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div>
      <div className="container">
        <nav className="nav">
          <Link href="/" className="logo">
            <div className="logo-mark">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>{t("brand")}</span>
          </Link>
          <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
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
              <h2 className="text-3xl font-black mb-6 tracking-tight">What is Ilm AI?</h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Learning never stops. Whether you are a 16-year-old preparing for university entrance exams, 
                  a 30-year-old engineer switching careers, or a doctor reading new research, Ilm AI is built for you.
                </p>
                <p>
                  Most learning tools are built around content — they give you videos and articles. 
                  Ilm AI is built around <strong>you</strong> — your materials, your pace, and your knowledge gaps.
                </p>
                <p>
                  Simply upload your textbooks, notes, or research papers, and Ilm AI becomes your personal tutor: 
                  quizzing you, explaining mistakes, and generating a personalized learning plan that fits your life.
                </p>
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
                    <p className="text-sm font-bold">Personalized</p>
                    <p className="text-xs text-slate-500">Tailored to your pace</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <h2 className="section-title">Our Services</h2>
          <p className="section-sub">Comprehensive tools designed to accelerate your learning journey</p>
          <div className="grid-3">
            <article className="card">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <h3>AI Learning Companion</h3>
              <p>Chat with your materials. Get instant answers grounded strictly in your uploaded content with citations.</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="h-6 w-6 text-green-500" />
              </div>
              <h3>Smart Quiz Mode</h3>
              <p>Test your knowledge with AI-generated questions at multiple difficulty levels. Get detailed explanations for every answer.</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <h3>Study Plan Generator</h3>
              <p>Input your goal and target date. Our AI agent creates a realistic day-by-day plan based on your materials and gaps.</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-pink-500" />
              </div>
              <h3>Knowledge Gap Detection</h3>
              <p>The system identifies concepts you struggle with across sessions and generates a report of what to revisit.</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-yellow-500" />
              </div>
              <h3>Multilingual Support</h3>
              <p>Full support for Uzbek, Russian, and English. Learn in the language you are most comfortable with.</p>
            </article>
            <article className="card">
              <div className="h-12 w-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-cyan-500" />
              </div>
              <h3>Global Accessibility</h3>
              <p>Built for learners worldwide, optimized for Uzbekistan and Central Asia. Accessible on any device, anywhere.</p>
            </article>
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
          <div className="mb-6 flex justify-center gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
          <p className="mb-2">© 2026 Ilm AI. All Rights Reserved.</p>
          <p className="text-slate-500 text-xs">Supported and accessible globally. Empowering learners everywhere.</p>
        </footer>
      </div>
    </div>
  );
}
