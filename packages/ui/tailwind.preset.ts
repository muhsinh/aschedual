import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-elev": "var(--surface-elev)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-pressed": "var(--accent-pressed)",
        focus: "var(--focus)"
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "14px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.25)",
        card: "0 6px 20px rgba(0,0,0,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
