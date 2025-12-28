import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          green: "#22C55E",
          "green-dark": "#16A34A",
          "green-darker": "#1A4D2E",
          red: "#C41E3A",
          "dark-brown": "#2B2520",
          cream: "#F5F1E8",
          cumin: "#8B6F47",
        },
      },
    },
  },
  plugins: [],
}

export default config
