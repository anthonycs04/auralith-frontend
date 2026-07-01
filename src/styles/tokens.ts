export const colors = {
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
} as const

export const fontFamily = {
  display: ['The Seasons', 'Georgia', 'serif'],
  body: ['Poppins', 'sans-serif'],
} as const

export const spacing = {
  sectionY: {
    mobile: 72,
    desktop: 128,
  },
  pageX: {
    mobile: 16,
    tablet: 24,
    desktop: 48,
  },
  container: 1152,
  prose: 640,
} as const

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const

export const shadows = {
  soft: '0 18px 60px rgba(34, 34, 34, 0.08)',
  lifted: '0 24px 80px rgba(34, 34, 34, 0.12)',
  gold: '0 16px 48px rgba(201, 168, 106, 0.28)',
} as const

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const motion = {
  duration: {
    fast: 0.18,
    base: 0.32,
    slow: 0.56,
    reveal: 0.72,
  },
  easing: {
    out: [0.22, 1, 0.36, 1],
    inOut: [0.65, 0, 0.35, 1],
    soft: [0.25, 0.46, 0.45, 0.94],
  },
  viewport: {
    once: true,
    amount: 0.22,
  },
} as const

export const zIndex = {
  header: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
} as const

export const designTokens = {
  colors,
  fontFamily,
  spacing,
  radii,
  shadows,
  breakpoints,
  motion,
  zIndex,
} as const

export type DesignTokens = typeof designTokens
export type ColorToken = keyof typeof colors
