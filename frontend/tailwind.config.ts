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
        warm: {
          primary: "#F5F0E8",     // Background primary
          secondary: "#EDE8DE",   // Cards
          tertiary: "#E6DFD3",    // Deep sections
          divider: "rgba(154,144,132,0.3)",
        },
        burnt: {
          DEFAULT: "#C4621D",     // Accent primary
          hover: "#A34E15",       // Accent hover
        },
        ink: {
          primary: "#2C2826",     // Text primary
          muted: "#7A7066",       // Text secondary
          label: "#9E9488",       // Section labels
        },
        decorative: "rgba(154,144,132,0.15)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        none: "none",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
