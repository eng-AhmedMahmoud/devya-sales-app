import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: { sora: ['var(--font-sora)', 'system-ui', 'sans-serif'] },
      // Type scale floored at 14px — nothing in the UI may render smaller,
      // and every step sits one notch above the Tailwind default (§3.2).
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        sm: ['0.9375rem', { lineHeight: '1.4rem' }], // 15px
        base: ['1rem', { lineHeight: '1.625rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.3125rem', { lineHeight: '1.875rem' }], // 21px
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px
        '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
        '4xl': ['2.5rem', { lineHeight: '3rem' }], // 40px
      },
      colors: {
        // 450 is the hint/disabled step: the only grey below ink-300 that still
        // clears 4.5:1 on every surface in the palette.
        // The original Devya ink scale. 825/775/760/450 are kept as aliases of
        // their neighbours so components written against them keep compiling.
        ink: {
          950: '#0A0A0A', 900: '#0F0F0F', 850: '#141414', 825: '#141414',
          800: '#1A1A1A', 775: '#1A1A1A', 760: '#1F1F1F', 750: '#1F1F1F',
          700: '#262626', 600: '#333333', 500: '#525252', 450: '#525252',
          400: '#737373', 300: '#A3A3A3', 200: '#D4D4D4', 100: '#F5F5F5',
        },
        // Accent — business green, same token outdoor-app uses.
        business: { DEFAULT: '#10B981', text: '#10B981', soft: 'rgba(16,185,129,0.12)' },
        sales: {
          new: '#94A3B8',
          contacted: '#60A5FA',
          qualified: '#8B5CF6',
          meeting: '#F59E0B',
          proposal: '#EAB308',
          negotiation: '#EC4899',
          won: '#10B981',
          lost: '#A3A3A3',
        },
      },
      borderRadius: { lg: '14px', md: '10px', sm: '8px' },
    },
  },
  plugins: [],
};
export default config;
