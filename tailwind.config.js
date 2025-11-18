import { theme } from './src/theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: theme.colors.primary.main,
          dark: theme.colors.primary.dark,
          light: theme.colors.primary.light,
        },
        // Secondary/accent colors
        secondary: {
          DEFAULT: theme.colors.secondary.main,
          dark: theme.colors.secondary.dark,
          light: theme.colors.secondary.light,
        },
        // Status colors
        success: {
          DEFAULT: theme.colors.status.success.text,
          bg: theme.colors.status.success.bg,
          text: theme.colors.status.success.text,
          border: theme.colors.status.success.border,
        },
        error: {
          DEFAULT: theme.colors.status.error.text,
          bg: theme.colors.status.error.bg,
          text: theme.colors.status.error.text,
          border: theme.colors.status.error.border,
        },
        warning: {
          DEFAULT: theme.colors.status.warning.text,
          bg: theme.colors.status.warning.bg,
          text: theme.colors.status.warning.text,
          border: theme.colors.status.warning.border,
        },
        info: {
          DEFAULT: theme.colors.status.info.text,
          bg: theme.colors.status.info.bg,
          text: theme.colors.status.info.text,
          border: theme.colors.status.info.border,
        },
        // Notion gray (keeping existing)
        'notion-gray': {
          50: '#f7f6f3',
          100: '#e9e9e7',
          200: '#d1d0ce',
          300: '#b9b7b5',
          400: '#9b9a97',
          500: '#787774',
          600: '#646461',
          700: '#474645',
          800: '#2e2e2c',
          900: '#1e1e1d',
        }
      },
      fontFamily: {
        sans: theme.typography.fontFamily.sans,
        primary: theme.typography.fontFamily.primary.split(',').map(f => f.trim()),
        mono: theme.typography.fontFamily.mono,
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      letterSpacing: theme.typography.letterSpacing,
      lineHeight: theme.typography.lineHeight,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      boxShadow: {
        sm: theme.shadows.sm,
        md: theme.shadows.md,
        lg: theme.shadows.lg,
        xl: theme.shadows.xl,
        '2xl': theme.shadows['2xl'],
      },
      transitionDuration: {
        fast: theme.transitions.fast,
        normal: theme.transitions.normal,
        slow: theme.transitions.slow,
      },
      zIndex: theme.zIndex,
    },
  },
  plugins: [],
}
