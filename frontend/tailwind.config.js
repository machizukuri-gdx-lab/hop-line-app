/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        hop: {
          primary: "#2dc75c",
          "primary-content": "#ffffff",
          secondary: "#f59e0b",
          "secondary-content": "#ffffff",
          accent: "#06C755",
          neutral: "#374151",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e5e7eb",
          info: "#3b82f6",
          success: "#2dc75c",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
    darkTheme: false,
  },
};

