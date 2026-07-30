"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch, getUnverifiedEmail } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();

  // Pre-warm the backend as soon as the login page opens. Render's free plan
  // spins the service down after idle; the first request (e.g. the Google OAuth
  // token exchange) then blocks ~30-60s while it cold-starts. Firing /health now,
  // before the user finishes typing / completes Google, gives it a head start so
  // the actual login isn't the one that pays the wake-up cost.
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    fetch(`${apiUrl}/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      login({
        id: data.user_id || data.id,
        name: data.name,
        email: data.email,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        profile_picture: data.profile_picture,
        oauth_provider: data.oauth_provider,
        oauth_provider_id: data.oauth_provider_id,
      });
      
      router.push("/dashboard");
    } catch (err: any) {
      const unverifiedEmail = getUnverifiedEmail(err);
      if (unverifiedEmail) {
        router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
        return;
      }
      setError(err.message === "Request failed (401)" ? t("err_fill") : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const tr = (uz: string, ru: string, en: string) => (lang === "ru" ? ru : lang === "en" ? en : uz);
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const url = `${apiUrl}/auth/google-login?redirect_uri=${encodeURIComponent(redirectUri)}`;

    // The backend may be cold-starting (Render free plan), so the first fetch can
    // fail with "Failed to fetch". Retry with backoff (~30s total) instead of
    // giving up — a woken backend answers within a few seconds. On a network
    // failure (not an HTTP error) we keep trying and show a "waking up" message.
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
        <p className="auth-sub">{t("login_sub")}</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>{t("email")}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label>{t("password")}</label>
            <PasswordInput required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <Link href="/forgot-password" className="auth-link" style={{ fontSize: "0.8125rem" }}>
              {t("forgot_password")}
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? t("thinking") : t("login_btn")}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-google"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path 
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                fill="#4285F4"
              />
              <path 
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                fill="#34A853"
              />
              <path 
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
                fill="#FBBC05"
              />
              <path 
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="auth-footer">
          {t("no_account")}{" "}
          <Link href="/signup" className="auth-link">{t("signup_link")}</Link>
        </p>
      </div>
    </div>
  );
}
