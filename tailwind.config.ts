import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-panel': 'var(--bg-panel)',
        chalk: 'var(--chalk)',
        'chalk-dim': 'var(--chalk-dim)',
        'chalk-faint': 'var(--chalk-faint)',
        yellow: 'var(--yellow)',
        coral: 'var(--coral)',
        sage: 'var(--sage)',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        flourish: ['var(--font-caveat)', 'cursive'],
      },
      borderRadius: {
        chalk: '3px',
      },
    },
  },
  plugins: [],
};

export default config;
