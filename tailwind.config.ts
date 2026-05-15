import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0b1f3b",
          orange: "#f97316",
          amber: "#fbbf24",
          sky: "#38bdf8",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(11, 31, 59, 0.08), 0 2px 8px -2px rgba(11, 31, 59, 0.06)",
        lift: "0 12px 40px -12px rgba(11, 31, 59, 0.12), 0 4px 16px -4px rgba(249, 115, 22, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
