/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191512",
        paper: "#F1ECE1",
        chili: "#FF4B2B",
        ember: "#E2812B",
        lime: "#C4F135",
        char: "#26201B",
        smoke: "#8A8178",
      },
      fontFamily: {
        display: ["Impact", "Arial Narrow", "sans-serif"],
      },
    },
  },
  plugins: [],
};
