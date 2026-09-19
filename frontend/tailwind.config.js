/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#030712', // Deep dark backdrop
          blue: '#0b192c', // Slate navy blue
          navy: '#1e3e62', // Classic railway navy
          accent: '#008dd5', // Electric blue highlights
          gold: '#f1c40f', // Bright golden accents
          steel: '#34495e', // Silver steel accents
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
