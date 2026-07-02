import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: { sora: ['var(--font-sora)', 'system-ui', 'sans-serif'] },
      colors: {
        ink: {
          950: '#0A0A0A', 900: '#0F0F0F', 850: '#141414', 800: '#1A1A1A',
          750: '#1F1F1F', 700: '#262626', 600: '#333333', 500: '#525252',
          400: '#737373', 300: '#A3A3A3', 200: '#D4D4D4', 100: '#F5F5F5',
        },
        sales: {
          new: '#94A3B8',
          contacted: '#60A5FA',
          qualified: '#8B5CF6',
          meeting: '#F59E0B',
          proposal: '#EAB308',
          negotiation: '#EC4899',
          won: '#10B981',
          lost: '#737373',
        },
      },
      borderRadius: { lg: '14px', md: '10px', sm: '8px' },
    },
  },
  plugins: [],
};
export default config;
