"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { useCountdown } from "@/hooks/useCountdown";
import { apiFetch } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordInput } from "@/components/PasswordInput";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { remaining: cooldown, start: startCooldown } = useCountdown();
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStep("confirm");
      startCooldown(RESEND_COOLDOWN);
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
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });
      startCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code, new_password: newPassword }),
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
          {t("forgot_title")}
        </h1>
        <p className="auth-sub">{t("forgot_subtitle")}</p>

        {step === "request" ? (
          <form onSubmit={handleRequestCode}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>{t("email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading || !email} className="btn btn-primary btn-block">
              {loading ? t("thinking") : t("forgot_send_btn")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
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
                style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "0.5em" }}
              />
            </div>
            <div className="form-group">
              <label>{t("forgot_new_password")}</label>
              <PasswordInput
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="form-hint">{t("password_hint")}</p>
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6 || newPassword.length < 8}
              className="btn btn-primary btn-block"
            >
              {loading ? t("thinking") : t("forgot_reset_btn")}
            </button>

            <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0, fontSize: "0.8125rem" }}>
              {t("verify_check_spam")}
            </div>

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
          </form>
        )}

        <p className="auth-footer">
          <Link href="/login" className="auth-link">
            {t("back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
