/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        iris: {
          50:  '#f4f3ff',
          100: '#ebe9fe',
          200: '#d5d0fd',
          300: '#b4abfb',
          400: '#907cf8',
          500: '#6e50f4',
          600: '#5b30ea',
          700: '#4c22d6',
          800: '#3f1db3',
          900: '#351a92',
          950: '#200e63',
        },
        zinc: {
          850: '#1f1f23',
          925: '#111113',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        scalePop:  { '0%': { transform: 'scale(0.85)', opacity: 0 }, '70%': { transform: 'scale(1.03)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        wiggle:    { '0%,100%': { transform: 'rotate(-2deg)' }, '50%': { transform: 'rotate(2deg)' } },
        typingDot: { '0%,80%,100%': { transform: 'scale(0.6)', opacity: 0.4 }, '40%': { transform: 'scale(1)', opacity: 1 } },
        slideIn:   { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideRight:{ from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        bounce:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        fadeUp:     'fadeUp 0.3s ease-out',
        fadeIn:     'fadeIn 0.25s ease-out',
        scalePop:   'scalePop 0.3s ease-out',
        shimmer:    'shimmer 1.5s infinite linear',
        wiggle:     'wiggle 0.4s ease-in-out',
        typingDot1: 'typingDot 1.2s 0s infinite',
        typingDot2: 'typingDot 1.2s 0.2s infinite',
        typingDot3: 'typingDot 1.2s 0.4s infinite',
        slideIn:    'slideIn 0.3s ease-out',
        slideRight: 'slideRight 0.3s ease-out',
      },
      boxShadow: {
        'iris':  '0 4px 24px -4px rgba(110,80,244,0.4)',
        'iris-lg': '0 8px 40px -8px rgba(110,80,244,0.5)',
        'msg':   '0 1px 2px rgba(0,0,0,0.08)',
        'msg-dark': '0 1px 3px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
