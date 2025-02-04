/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#4a90e2',
        urgent: '#e74c3c',
        important: '#f39c12',
        normal: '#2ecc71',
        background: '#f5f6fa',
      },
    },
  },
  plugins: [],
}
