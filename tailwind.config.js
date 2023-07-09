/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'sb': "0 0 10px rgb(0 0 0 / 30%)",
        'infopanel': '0 0 10px 5px rgb(0 0 200 / 30%)'
      },
      colors: {
        navhover: '#005aff4a',
        file: '#0014ff',
        filehover: '#2e65ff',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        quaternary: 'rgb(var(--color-quaternary) / <alpha-value>)'
      }
    },
  },
  plugins: [plugin(function ({ addUtilities }) {
    addUtilities({
      '.flip-y': {
        'transform': 'rotateY(180deg)',
      }
    })
  })],
}
