/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-ocean': '#050d1a',
        'midnight-water': '#0a1628',
        'bioluminescent': '#00e5ff',
        'coral-warm': '#ff6b47',
        'sea-foam': '#b2eef4',
        'abyss': '#020810',
        'glass-sheen': 'rgba(255, 255, 255, 0.04)',
        'kelp-green': '#1a3a2e',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
