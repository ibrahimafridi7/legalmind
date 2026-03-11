/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Strict brand palette: Slate-900 for authority/background, Indigo-600 for actions.
        brand: {
          dark: '#0F172A',   // Slate-900 – legal authority / primary background
          action: '#4F46E5', // Indigo-600 – primary actions, links, focus
          surface: '#020617',
          muted: '#94A3B8',  // Muted text; ensure 4.5:1 contrast on dark for WCAG AA
        },
      },
    },
  },
  plugins: [],
}

