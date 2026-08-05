"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

// Shown once, right after Google sign-in, for a user who hasn't set a name + age
// yet. Both are required before entering the app. Google gives us a name, but we
// let the learner choose their own (nickname) and add their age.
export default function OnboardingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { t, lang } = useI18n();
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    // Prefill with the name Google gave us; the user can change it.
    if (user.name) setName(user.name);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    const ageNum = parseInt(age, 10);
    if (trimmed.length < 2) {
      setError(tr("Ismingizni kiriting.", "Введите имя.", "Please enter your name."));
      return;
    }
    if (!ageNum || ageNum < 5 || ageNum > 100) {
      setError(tr("Yoshingizni to'g'ri kiriting (5–100).", "Введите корректный возраст (5–100).", "Enter a valid age (5–100)."));
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await apiFetch("/auth/complete-onboarding", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, name: trimmed, age: ageNum }),
      });
      // Keep the local session in sync with the chosen name.
      login({ ...user, name: trimmed });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || tr("Xatolik yuz berdi.", "Произошла ошибка.", "Something went wrong."));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: "fixed", top: 24, right: 24 }} className="flex items-center gap-2 z-50">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="logo" style={{ textDecoration: "none", justifyContent: "center" }}>
            <div className="logo-mark">
              <img src="/logo-icon.png" alt="Ilm AI" />
            </div>
            <span>{t("brand")}</span>
          </span>
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
          {tr("Xush kelibsiz! 👋", "Добро пожаловать! 👋", "Welcome! 👋")}
        </h1>
        <p className="auth-sub">
          {tr("Boshlashdan oldin o'zingiz haqingizda ozgina ayting.", "Прежде чем начать, расскажите немного о себе.", "Before we start, tell us a bit about you.")}
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>{tr("Ismingiz", "Ваше имя", "Your name")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("Ism yoki taxallus", "Имя или никнейм", "Name or nickname")}
              maxLength={40}
            />
          </div>
          <div className="form-group">
            <label>{tr("Yoshingiz", "Ваш возраст", "Your age")}</label>
            <input
              type="number"
              required
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
            {loading ? t("thinking") : tr("Davom etish", "Продолжить", "Continue")}
          </button>
        </form>
      </div>
    </div>
  );
}
