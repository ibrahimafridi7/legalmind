/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',
          action: '#4F46E5',
          surface: '#1E293B',
          muted: '#94A3B8'
        }
      }
    }
  },
  plugins: []
}

