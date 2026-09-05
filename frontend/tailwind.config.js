/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medlens: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a9f7',
          500: '#0e8ceb',
          600: '#026ec7',
          700: '#0357a1',
          800: '#074a85',
          900: '#0c3e6e',
          950: '#082749',
        }
      }
    },
  },
  plugins: [],
}
