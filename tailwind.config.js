/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        verde: "#0ba27f",
        darkblue: "#002857",
        blanco : "#FFFF",
        negro : "#000000",
        colortransicion: "#0BAC7F",
      },
    },
  },
  plugins: [],
}
