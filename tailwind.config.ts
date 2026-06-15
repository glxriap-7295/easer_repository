import type { Config } from "tailwindcss";

// EASER geoscience identity (aligned with the official logo & proyectoeaser.cl).
// brand  = deep petrol/teal — ocean/earth depth, seismic science (primary).
// accent = warm gold/amber — taken from the EASER logo (highlights, links).
// neutrals use Tailwind's warm "stone" scale.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4f6", 100: "#d6e6ea", 200: "#aecfd6", 300: "#7db0bb",
          400: "#4f8e9d", 500: "#2f6f80", 600: "#245a69", 700: "#1d4a57",
          800: "#173b46", 900: "#122e37"
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
        card: "0 1px 2px rgba(18,46,55,0.05), 0 4px 16px rgba(18,46,55,0.08)"
      }
    }
  },
  plugins: []
};
export default config;
