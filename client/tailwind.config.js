/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf6',
          100: '#dcfced',
          200: '#b8f5da',
          300: '#84e9bd',
          400: '#4bd69b',
          500: '#22b97e',
          600: '#159566',
          700: '#137753',
          800: '#135f44',
          900: '#114e39',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
