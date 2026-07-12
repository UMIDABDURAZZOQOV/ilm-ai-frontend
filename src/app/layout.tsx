import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import "@/sentry.client.config";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Ilm AI — Personal AI Learning Companion",
  description: "Learn anything from your own materials using AI",
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
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
