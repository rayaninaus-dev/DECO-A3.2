/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        indigoAccent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          300: "#a5b4fc",
          500: "#6366f1",
          600: "#4f46e5",
          900: "#312e81",
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '"Segoe UI"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
      borderRadius: {
        soft: "14px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
