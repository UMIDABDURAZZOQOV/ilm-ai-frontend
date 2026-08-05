"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

// Google-only entry. There is one button that both signs up and logs in — Google
// has already vetted the account, so we no longer ask for an email + password (a
// fake email could otherwise sign up, and we send no verification code). The
// email/password backend endpoints still exist for support, just not in the UI.
export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);

  // Already signed in? Skip the login screen.
  useEffect(() => {
    if (user) window.location.href = "/dashboard";
  }, [user]);

  // Pre-warm the backend (Render free plan cold-starts) so the Google token
  // exchange isn't the request that pays the ~30-60s wake-up cost.
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${apiUrl}/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const url = `${apiUrl}/auth/google-login?redirect_uri=${encodeURIComponent(redirectUri)}`;

    // The backend may be cold-starting; retry with backoff (~30s total) on a
    // network failure instead of giving up.
    const delays = [0, 3000, 5000, 7000, 9000, 9000];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise((r) => setTimeout(r, delays[i]));
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
          return;
        }
        setError(tr("Google login manzilini olishda xato.", "Ошибка получения ссылки Google.", "Couldn't get the Google login link."));
        setLoading(false);
        return;
      } catch {
        if (i < delays.length - 1) {
          setError(tr("Server uyg'onmoqda, biroz kuting…", "Сервер просыпается, подождите…", "Server is waking up, please wait…"));
          continue;
        }
        setError(tr("Server javob bermadi — birozdan so'ng qayta urinib ko'ring.", "Сервер не ответил — попробуйте чуть позже.", "The server didn't respond — please try again shortly."));
      }
    }
    setLoading(false);
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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>{t("login_title")}</h1>
        <p className="auth-sub">
          {tr(
            "Google bilan bir marta bosib kiring — ro'yxatdan o'tish ham, kirish ham shu.",
            "Войдите одним нажатием через Google — это и регистрация, и вход.",
            "Continue with Google in one tap — it both signs you up and logs you in.",
          )}
        </p>

        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
          style={{ marginTop: 20 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {loading ? t("thinking") : tr("Google bilan davom etish", "Продолжить с Google", "Continue with Google")}
        </button>
      </div>
    </div>
  );
}
