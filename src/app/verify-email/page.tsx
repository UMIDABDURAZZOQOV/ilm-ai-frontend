"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { useCountdown } from "@/hooks/useCountdown";
import { apiFetch } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { remaining: cooldown, start: startCooldown } = useCountdown();
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!email) router.push("/signup");
  }, [email, router]);

  useEffect(() => {
    startCooldown(RESEND_COOLDOWN);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      login({
        id: data.user_id,
        name: data.name,
        email: data.email,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await apiFetch("/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      startCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message);
    }
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
              <img src="/logo-icon.png" alt="Ilm AI" />
            </div>
          </span>
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
          {t("verify_title")}
        </h1>
        <p className="auth-sub">{t("verify_subtitle").replace("{email}", email)}</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder={t("verify_code_placeholder")}
              autoFocus
              style={{
                textAlign: "center",
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "0.5em",
              }}
            />
          </div>

          <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary btn-block">
            {loading ? t("thinking") : t("verify_btn")}
          </button>

          <div className="alert alert-info" style={{ marginTop: 16, fontSize: "0.8125rem" }}>
            {t("verify_check_spam")}
          </div>
        </form>

        <p className="auth-footer">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: cooldown > 0 ? "var(--muted)" : "var(--link)",
              fontWeight: 600,
              cursor: cooldown > 0 ? "default" : "pointer",
              padding: 0,
            }}
          >
            {cooldown > 0 ? t("verify_resend_wait").replace("{s}", String(cooldown)) : t("verify_resend")}
          </button>
        </p>
      </div>
    </div>
  );
}
