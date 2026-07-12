"use client";

import { useState, InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** A password input with an eye icon to reveal/hide what was typed — so users can visually confirm two password fields actually match instead of guessing. */
export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input {...props} type={visible ? "text" : "password"} style={{ paddingRight: 44 }} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.1rem",
          padding: 4,
          lineHeight: 1,
        }}
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
