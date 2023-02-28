/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'sb': "0 0 10px rgb(0 0 0 / 30%)"
      },
      colors: {
        'navhover': '#005aff4a'
      }
    },
  },
  plugins: [plugin(function({ addUtilities }) {
    addUtilities({
      '.flip-y': {
        'transform': 'rotateY(180deg)',
      }
    })
  })],
}
