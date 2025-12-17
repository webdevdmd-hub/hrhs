module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './shared/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          green: '#10b981',
          purple: '#8b5cf6',
          pink: '#ec4899',
        }
      }
    }
  },
  plugins: [],
}
