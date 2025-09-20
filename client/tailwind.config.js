/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      // TV-optimized spacing and sizing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'tv-xs': ['1rem', '1.5rem'],
        'tv-sm': ['1.25rem', '1.75rem'],
        'tv-base': ['1.5rem', '2rem'],
        'tv-lg': ['1.875rem', '2.25rem'],
        'tv-xl': ['2.25rem', '2.75rem'],
        'tv-2xl': ['3rem', '3.5rem'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      // TV-friendly focus styles
      ringWidth: {
        '6': '6px',
        '8': '8px',
      }
    },
  },
  plugins: [],
}