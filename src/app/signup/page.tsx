"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("err_password_len"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("err_password_match"));
      return;
    }
    setLoading(true);

    try {
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      // When email verification is disabled on the backend, signup returns
      // tokens directly → log in and go straight to the dashboard.
      if (data.verification_required === false && data.access_token) {
        login({
          id: data.user_id,
          name: data.name,
          email: data.email,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        router.push("/dashboard");
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/google-callback`;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/auth/google-login?redirect_uri=${encodeURIComponent(redirectUri)}`);
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        setError("Google login manzilini olishda xato.");
      }
    } catch (err: any) {
      setError("Google login ishlamadi: " + err.message);
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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>{t("signup_title")}</h1>
        <p className="auth-sub">{t("signup_sub")}</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="alert alert-info" style={{ fontSize: "0.8125rem" }}>
            {t("signup_verify_note")}
          </div>

          <div className="form-group">
            <label>{t("name")}</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>{t("email")}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label>{t("password")}</label>
            <PasswordInput required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            <p className="form-hint">{t("password_hint")}</p>
          </div>
          <div className="form-group">
            <label>{t("confirm_password")}</label>
            <PasswordInput required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 6 }}>{t("err_password_match")}</p>
            )}
            {confirmPassword.length >= 8 && password === confirmPassword && (
              <p style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: 6 }}>{t("password_match_ok")}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? t("thinking") : t("signup_btn")}
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
          {t("have_account")}{" "}
          <Link href="/login" className="auth-link">{t("login_link")}</Link>
        </p>
      </div>
    </div>
  );
}
