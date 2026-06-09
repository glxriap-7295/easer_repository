import type { Config } from "tailwindcss";

// EASER earth-tone design language (inspired by proyectoeaser.cl).
// brand = terracotta/clay primary; accent = deep pine/teal; neutrals use "stone".
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf6f2", 100: "#f3e9e0", 200: "#e6d2c1", 300: "#d4b39a",
          400: "#c08e6e", 500: "#a9714f", 600: "#8f5a3c", 700: "#734733",
          800: "#5d3a2c", 900: "#4d3127"
        },
        accent: {
          50: "#eef5f3", 100: "#d4e7e1", 200: "#a9cfc3", 300: "#75b0a0",
          400: "#479184", 500: "#2f6b5e", 600: "#245447", 700: "#1e443a",
          800: "#193730", 900: "#142d28"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(77,49,39,0.04), 0 4px 16px rgba(77,49,39,0.06)"
      }
    }
  },
  plugins: []
};
export default config;
