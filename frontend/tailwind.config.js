/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ana renk paleti
        navy: {
          900: '#0c1120', // Arka plan 
          800: '#111827', // Kart arka planı
          700: '#1e293b', // Kart alt arka planı
          600: '#334155', // Bordürler
        },
        // Aksan renkleri
        accent: {
          blue: '#3b82f6',   // Mavi aksan
          teal: '#14b8a6',   // Teal aksan
          green: '#22c55e',  // Yeşil aksan
          purple: '#8b5cf6', // Mor aksan
          red: '#ef4444',    // Kırmızı aksan
          amber: '#f59e0b',  // Amber aksan
        },
        'chart': {
          blue: 'rgba(59, 130, 246, 0.5)',
          red: 'rgba(239, 68, 68, 0.5)',
          green: 'rgba(34, 197, 94, 0.5)',
          purple: 'rgba(168, 85, 247, 0.5)',
          teal: 'rgba(20, 184, 166, 0.5)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.25)',
        nav: '0 2px 10px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        card: '0.75rem',
      },
      screens: {
        xs: '480px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 