/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        secondary: "#a855f7",
        accent: "#22d3ee",
        slate: {
          950: "#07070f",
        },
        // OnePrep-style SAT platform palette
        op: {
          teal: "#0E607A",
          tealDark: "#0A4F66",
          tealBorder: "#1B7089",
          tealHover: "#1B7089",
          tealText: "#EAF5F9",
          tealMuted: "#8FBECC",
          blue: "#2FA8F5",
          blueHover: "#1B8FD9",
          ink: "#1B2733",
          slate: "#5A6772",
          muted: "#8B959D",
          faint: "#9AA5AD",
          line: "#E7EBED",
          panel: "#F6F8F9",
          panel2: "#F4F6F7",
          sky: "#DFF4FD",
          skyText: "#1478B0",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "system-ui", "sans-serif"],
        "serif-sat": ["var(--font-serif-sat)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
