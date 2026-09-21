module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
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
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#b3d7ff",
          300: "#7ebcff",
          400: "#4a9eff",
          500: "#2e7ef5",
          600: "#2563eb",
          700: "#1d4fc4",
          800: "#1a3f96",
          900: "#152f6e",
        },
      },
      fontFamily: {
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
