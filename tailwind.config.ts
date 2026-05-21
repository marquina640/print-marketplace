import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy — dark theme (50 = page bg, 900 = main text)
        warm: {
          50:  '#0F0D14',  // page background
          100: '#1C1829',  // card / sidebar / navbar surface
          200: '#2D2845',  // borders, dividers
          300: '#3D3A58',  // stronger border
          400: '#6B6480',  // muted icons
          500: '#8E86A8',  // secondary text
          600: '#B0A8C8',  // medium text
          700: '#CEC8E4',  // light text
          800: '#E4DFF2',  // very light
          900: '#F2EEFF',  // main body text
        },
        // Deep purple — brand primary
        ink: {
          50:   '#231840',
          100:  '#312558',
          200:  '#4A3880',
          400:  '#7860B8',
          500:  '#6850A8',
          600:  '#584098',
          700:  '#483088',
          800:  '#3D2878',  // primary button bg
          900:  '#332070',  // primary button hover
          950:  '#2B1B47',  // brand deep purple
        },
        // Ochre — CTA accent
        gold: {
          300: '#F5D468',
          400: '#EAB82A',
          500: '#D4A017',  // brand ochre
          600: '#B88514',
          700: '#8F6510',
        },
        // Violet — keep for compatibility
        violet: {
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        lift:  '0 4px 20px -2px rgb(0 0 0 / 0.4), 0 2px 8px -2px rgb(0 0 0 / 0.3)',
        glow:  '0 0 0 3px rgb(212 160 23 / 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
