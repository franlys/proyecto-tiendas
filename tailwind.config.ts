import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Linko Premium Dark Palette
        background: "#0F172A", // Deep Navy Blue
        surface: "#1E293B",
        primary: {
          DEFAULT: "var(--theme-primary)", // Dynamic Theme Color
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "var(--theme-primary)", // Also map 500 to main var for consistency
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        // Clean White / Silver for text
        silver: "#F8FAFC",
        gold: {
          DEFAULT: "var(--theme-accent)", // Dynamic Accent Color
          light: "#E5C654",
          dark: "#B8960F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #E5C654 100%)",
        "gradient-dark": "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
