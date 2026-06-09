import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb", 100: "#d6e4f5", 200: "#aecae9",
          300: "#7da8d9", 400: "#4f84c6", 500: "#2f66ad",
          600: "#244f88", 700: "#1e406d", 800: "#1b3559", 900: "#172c4a"
        },
        accent: { 500: "#0f766e", 600: "#0d655e" }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
