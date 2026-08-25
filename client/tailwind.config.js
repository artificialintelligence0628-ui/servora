/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Forest green, drawn from the logo's ribbon gradient.
        brand: {
          50: '#f0fdf6',
          100: '#dcfced',
          200: '#b8f5da',
          300: '#7fe8b8',
          400: '#3ccb8a',
          500: '#189960',
          600: '#0f7a4c',
          700: '#0d5f3d',
          800: '#0c4a32',
          900: '#0a3a29',
          950: '#04160f',
        },
        // Gold, the second half of the logo's gradient — used sparingly,
        // as an accent (CTA emphasis, glows), never as a base surface color.
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde48a',
          300: '#fbd155',
          400: '#f8bc2e',
          500: '#eda512',
          600: '#cc820a',
          700: '#a3620c',
        },
        // Near-black, matching the logo's native canvas — used for the
        // marketing surfaces (nav, hero) only, not the working dashboards.
        ink: {
          900: '#0a0f0c',
          950: '#050807',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(115deg, #0d5f3d 0%, #189960 45%, #eda512 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
