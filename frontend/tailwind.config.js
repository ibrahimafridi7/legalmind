/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',
          action: '#4F46E5',
          surface: '#020617',
          muted: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
}

