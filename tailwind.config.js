/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      mob: "375px",
      tablet: "768px",
      laptop: "1024px",
      desktop: "1280px",
      laptopl: "1440px",
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1f2a37",
          muted: "#4b5563",
          light: "#6b7280",
        },
        teal: {
          DEFAULT: "#2f5d56",
          dark: "#244943",
          light: "#3d776f",
          text: "#2f5d56",
        },
        cream: "#f8f3e8",
        "band-services": "#f3e9db",
        "band-about": "#fcf9f3",
        "page-bg": "#f1e4d0",
        chip: "#efe7d8",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        kalam: ["Kalam", "cursive"],
        display: ["Nunito", "sans-serif"],
        body: ["Raleway", "sans-serif"],
      },
    },
  },
  plugins: [],
};
