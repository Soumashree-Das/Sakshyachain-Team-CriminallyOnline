/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff7f1', 100: '#dcefe0', 200: '#bee0c5', 300: '#93c99f', 400: '#62a977',
          500: '#3c8c56', 600: '#287344', 700: '#205c39', 800: '#1b4930', 900: '#173d2a', 950: '#0b2619',
        },
        indigo: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
          500: '#f08429', 600: '#dd6b1d', 700: '#b95018', 800: '#963f18', 900: '#7a3518', 950: '#421a0b',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f08429',
          600: '#dd6b1d',
          700: '#b95018',
          900: '#663815',
        }
      }
    },
  },
  plugins: [],
}
