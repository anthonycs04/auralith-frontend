import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F5F1E8',
          dark: '#E8E2D6',
          light: '#FAF8F3',
        },
        sage: {
          DEFAULT: '#8FA58C',
          light: '#B5C9B2',
          dark: '#6B8A68',
        },
        beige: {
          DEFAULT: '#9F8F7E',
          light: '#C4B8AB',
          dark: '#7A6D60',
        },
        gold: {
          DEFAULT: '#C9A86A',
          light: '#DFC08A',
          dark: '#A8854A',
        },
        ink: {
          DEFAULT: '#222222',
          soft: '#3D3D3D',
          muted: '#6B6B6B',
        },
      },
      fontFamily: {
        display: ['The Seasons', 'Georgia', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        soft: '0.5rem',
        organic: '1.25rem',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(34, 34, 34, 0.08)',
        lifted: '0 24px 80px rgba(34, 34, 34, 0.12)',
        gold: '0 16px 48px rgba(201, 168, 106, 0.28)',
      },
      maxWidth: {
        content: '72rem',
        prose: '64ch',
      },
      transitionTimingFunction: {
        auralith: 'cubic-bezier(0.22, 1, 0.36, 1)',
        grounded: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      zIndex: {
        header: '40',
        overlay: '50',
        modal: '60',
      },
    },
  },
  plugins: [typography],
} satisfies Config

export default config
