/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Asegura el escaneo de hooks, views y components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}