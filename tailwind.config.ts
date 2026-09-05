import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f6",
          100: "#dbf0e8",
          200: "#b8e1d3",
          300: "#8bcbb8",
          400: "#5aad98",
          500: "#3b8f7c",
          600: "#2c7264",
          700: "#255c52",
          800: "#204a43",
          900: "#1c3e39",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
