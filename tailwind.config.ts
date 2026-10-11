import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
} satisfies Config;
