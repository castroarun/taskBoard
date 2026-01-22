import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional blue theme (from mockup)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#d4d4d8',
            h1: { color: '#fafafa' },
            h2: { color: '#fafafa' },
            h3: { color: '#fafafa' },
            h4: { color: '#fafafa' },
            strong: { color: '#fafafa' },
            a: { color: '#60a5fa', '&:hover': { color: '#93c5fd' } },
            code: {
              color: '#a5f3fc',
              backgroundColor: '#27272a',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: '#18181b',
              color: '#d4d4d8',
              border: '1px solid #3f3f46',
            },
            blockquote: {
              color: '#a1a1aa',
              borderLeftColor: '#3f3f46',
            },
            hr: { borderColor: '#3f3f46' },
            'ul > li::marker': { color: '#71717a' },
            'ol > li::marker': { color: '#71717a' },
            th: { color: '#fafafa' },
            td: { borderBottomColor: '#3f3f46' },
            thead: { borderBottomColor: '#3f3f46' },
            'tbody tr': { borderBottomColor: '#27272a' },
          },
        },
      },
    },
  },
  plugins: [typography],
};
