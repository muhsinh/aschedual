import type { Config } from "tailwindcss";
import preset from "@aschedual/ui/tailwind.preset";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
};

export default config;
