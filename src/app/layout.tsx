import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import TestModeBanner from "@/components/TestModeBanner";
import CommandPalette from "@/components/ui/CommandPalette";
import PwaRegister from "@/components/ui/PwaRegister";
import "@/sentry.client.config";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// OnePrep-style typography used across the SAT platform: Manrope for UI,
// Source Serif for passages and question stems (Bluebook look).
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-sat" });

export const metadata: Metadata = {
  title: "Ilm AI — Personal AI Learning Companion",
  description: "Learn anything from your own materials using AI",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ilm AI" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport = {
  themeColor: "#4f46e5",
};

// Applied before React hydrates so there's no flash of the wrong theme —
// reads the same localStorage key useTheme.tsx uses. Defaults to the OS
// preference ("system") when nothing is stored yet, matching mobile's
// ThemeProvider default exactly.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("ilm_theme_mode");
    var mode = stored === "light" || stored === "dark" ? stored : "system";
    var resolved = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    if (resolved === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${jakarta.variable} ${manrope.variable} ${sourceSerif.variable} font-sans antialiased`}>
        <Providers>
          <TestModeBanner />
          <CommandPalette />
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
