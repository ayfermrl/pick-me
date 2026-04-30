/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#161923",
        grape: "#8b70dd",
        berry: "#f277a9",
        mint: "#5bcfb4",
        honey: "#ffbd59",
      },
      boxShadow: {
        glow: "0 24px 70px rgba(41, 38, 66, 0.16)",
      },
    },
  },
  plugins: [],
};
