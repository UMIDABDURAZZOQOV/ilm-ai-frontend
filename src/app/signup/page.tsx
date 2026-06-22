"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { apiFetch } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BookOpen } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      const data = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/auth/google-login?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <div className="auth-page">
      <div style={{ position: "fixed", top: 24, right: 24 }}>
        <LanguageSwitcher />
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="logo" style={{ textDecoration: "none", justifyContent: "center" }}>
            <div className="logo-mark">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>{t("brand")}</span>
          </span>
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>{t("signup_title")}</h1>
        <p className="auth-sub">{t("signup_sub")}</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

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
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? t("thinking") : t("signup_btn")}
          </button>

          <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#374151" }}></div>
            <span style={{ padding: "0 16px", color: "#9ca3af", fontSize: "0.875rem" }}>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#374151" }}></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-outline btn-block"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "12px",
              padding: "12px 16px",
              border: "1px solid #374151",
              borderRadius: "8px",
              background: "#1f2937",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
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
          <Link href="/login" style={{ color: "#a5b4fc", fontWeight: 600, textDecoration: "none" }}>{t("login_link")}</Link>
        </p>
      </div>
    </div>
  );
}
