"use client";

import React from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/hooks/useI18n";
import { ThemeProvider } from "@/hooks/useTheme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>{children}</I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default Providers;
