import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Phase colors - must be safelisted for dynamic class usage
    'text-design', 'bg-design', 'border-design', 'bg-design/10', 'border-design/30',
    'text-engineering', 'bg-engineering', 'border-engineering', 'bg-engineering/10', 'border-engineering/30',
    'text-build', 'bg-build', 'border-build', 'bg-build/10', 'border-build/30',
    'text-launch', 'bg-launch', 'border-launch', 'bg-launch/10', 'border-launch/30',
    'text-closure', 'bg-closure', 'border-closure', 'bg-closure/10', 'border-closure/30',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Klarity brand colors
        klarity: {
          indigo: '#6366f1',
          purple: '#a78bfa',
          cyan: '#22d3ee',
        },
        // Phase colors
        design: {
          DEFAULT: '#ec4899',
          light: '#fce7f3',
          dark: '#9d174d',
        },
        engineering: {
          DEFAULT: '#818CF8',
          light: '#c7d2fe',
          dark: '#4338ca',
        },
        build: {
          DEFAULT: '#facc15',
          light: '#fef9c3',
          dark: '#a16207',
        },
        launch: {
          DEFAULT: '#4ade80',
          light: '#dcfce7',
          dark: '#166534',
        },
        closure: {
          DEFAULT: '#2dd4bf',
          light: '#ccfbf1',
          dark: '#0f766e',
        },
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
