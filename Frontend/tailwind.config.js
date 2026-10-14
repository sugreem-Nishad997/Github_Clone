/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gh: {
          bg: '#0d1117',
          surface: '#161b22',
          subtle: '#21262d',
          border: '#30363d',
          borderSubtle: '#21262d',
          text: '#c9d1d9',
          heading: '#f0f6fc',
          muted: '#8b949e',
          accent: '#58a6ff',
          success: '#238636',
          successHover: '#2ea043',
          danger: '#da3633',
          dangerHover: '#f85149',
          warning: '#d29922',
          purple: '#8957e5',
        }
      }
    },
  },
  plugins: [],
}
