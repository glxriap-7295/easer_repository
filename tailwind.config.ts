import type { Config } from "tailwindcss";

// EASER institutional identity (mockup source of truth).
// brand  = forest / olive green (hero, footer, primary actions).
// accent = warm gold/amber (highlights, links). Neutrals use warm "stone".
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ef", 100: "#d7e6dc", 200: "#aecdb8", 300: "#7fb08f",
          400: "#4f8d64", 500: "#2f6f45", 600: "#255736", 700: "#1e472c",
          800: "#173722", 900: "#122a1b"
        },
        accent: {
          50: "#fdf6e9", 100: "#f8e7c2", 200: "#f0cf86", 300: "#e6b455",
          400: "#d99a2f", 500: "#bf7e1c", 600: "#9c6416", 700: "#7c4f14",
          800: "#5f3d12", 900: "#4d3210"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,42,27,0.04), 0 6px 20px rgba(18,42,27,0.06)"
      }
    }
  },
  plugins: []
};
export default config;
