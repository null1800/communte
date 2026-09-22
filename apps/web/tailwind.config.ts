import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ComUnite Primary — Deep Indigo (trust, depth, credibility)
        primary: {
          DEFAULT: '#1B3FA8',
          foreground: '#FFFFFF',
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F6DD4',
          600: '#3352C1',
          700: '#1B3FA8',
          800: '#162F82',
          900: '#0F1F57',
        },
        // ComUnite Accent — Warm Amber (community, warmth, savings)
        accent: {
          DEFAULT: '#F4A823',
          foreground: '#1A1100',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F4A823',
          600: '#D97706',
          700: '#B45309',
        },
        // ComUnite Surfaces
        background: '#F0F2F8',
        surface:    '#FFFFFF',
        border:     '#DDE1ED',
        // Text
        foreground: '#111827',
        muted:      '#6B7280',
        'muted-foreground': '#9CA3AF',
        // Semantic
        success:  '#15803D',
        'success-light': '#DCFCE7',
        warning:  '#D97706',
        'warning-light': '#FEF3C7',
        error:    '#DC2626',
        'error-light':   '#FEE2E2',
        // Progress states
        progress: {
          low:    '#6366F1',
          mid:    '#1B3FA8',
          high:   '#15803D',
          full:   '#F4A823',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        sidebar: '15rem',    // 240px
        'sidebar-sm': '4rem', // 64px  collapsed
        topbar: '3.5rem',     // 56px
        bottomnav: '4rem',    // 64px
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        topbar: '0 1px 0 0 #DDE1ED',
        sidebar: '1px 0 0 0 #DDE1ED',
      },
      keyframes: {
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'progress-fill': {
          from: { width: '0%' },
        },
      },
      animation: {
        'slide-in-left':  'slide-in-left 0.25s ease-out',
        'slide-out-left': 'slide-out-left 0.25s ease-in',
        'fade-in':        'fade-in 0.15s ease-out',
        'progress-fill':  'progress-fill 0.8s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
