"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  // Google's authorization code is single-use. React's Strict Mode (dev only)
  // deliberately double-invokes effects, which would otherwise send the same
  // code to the backend twice and fail the second exchange with
  // invalid_grant. Guard so the exchange only ever runs once per mount.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        if (error) {
          setError(`Authentication error: ${error}`);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        if (!code) {
          setError("No authorization code received from Google");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Exchange the code for tokens with the backend using GET request
        const redirectUri = `${window.location.origin}/auth/google-callback`;
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/auth/google-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Authentication failed");
        }

        // Login with the received tokens
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

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message || "Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router, login]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        {error ? (
          <>
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              {error}
            </div>
            <p style={{ color: "#9ca3af" }}>Redirecting to login page...</p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <div className="logo-mark" style={{ margin: "0 auto 16px" }}>
                <img src="/logo-icon.png" alt="Ilm AI" />
              </div>
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "8px" }}>
              Authenticating...
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              Please wait while we complete your Google authentication
            </p>
          </>
        )}
      </div>
    </div>
  );
}
