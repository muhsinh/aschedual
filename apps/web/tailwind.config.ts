import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        panel: "var(--color-panel)",
        panel2: "var(--color-panel-2)",
        irish: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          highlight: "var(--color-primary-highlight)"
        },
        seafoam: {
          1: "var(--color-seafoam-1)",
          2: "var(--color-seafoam-2)"
        }
      },
      borderRadius: {
        xl: "14px",
        '2xl': "18px"
      },
      boxShadow: {
        card: "0 8px 28px rgba(0, 0, 0, 0.32)"
      },
      maxWidth: {
        content: "1120px"
      }
    }
  },
  plugins: []
};

export default config;
