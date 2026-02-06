/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#a78bfa",
        "primary-light": "#c4b5fd",
        "primary-dark": "#7c3aed",
        surface: "#18181b",
        "surface-light": "#27272a",
        "background-dark": "#09090b",
        "card-dark": "#18181b",
        "border-dark": "rgba(255, 255, 255, 0.08)",
        "border-light": "rgba(255, 255, 255, 0.12)",
        "text-primary": "#fafafa",
        "text-secondary": "#a1a1aa",
        "text-muted": "#71717a",
        success: "#4ade80",
        "success-muted": "rgba(74, 222, 128, 0.15)",
        danger: "#f87171",
        "danger-muted": "rgba(248, 113, 113, 0.15)",
        warning: "#fbbf24",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(167, 139, 250, 0.15)",
        "glow-lg": "0 0 40px rgba(167, 139, 250, 0.2)",
        card: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
        "card-hover":
          "0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
