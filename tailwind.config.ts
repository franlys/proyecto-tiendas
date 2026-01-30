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
        // Premium Dark Palette
        background: "#0F172A",
        surface: "#1E293B",
        primary: {
          DEFAULT: "#F43F5E",
          50: "#FEF2F3",
          100: "#FEE2E5",
          200: "#FFC9CF",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C654",
          dark: "#B8960F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #F43F5E 0%, #FB923C 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #E5C654 100%)",
        "gradient-dark": "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(244, 63, 94, 0.3)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
