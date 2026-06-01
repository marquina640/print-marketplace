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
        // Surface hierarchy - light theme (50 = page bg, 900 = main text)
        warm: {
          50:  '#FAFAFA',   // page background (near white)
          100: '#F4F3F8',   // card / sidebar surface
          200: '#E8E4F0',   // borders, dividers
          300: '#D0C8E0',   // stronger border
          400: '#A89DB8',   // muted icons / placeholder
          500: '#7A6F96',   // secondary / muted text
          600: '#5C5275',   // medium text
          700: '#3D3060',   // primary text
          800: '#2B1B47',   // dark text (brand purple)
          900: '#1A1028',   // darkest text
        },
        // Deep purple - brand primary (buttons, active states)
        ink: {
          50:   '#F5F2FF',
          100:  '#EBE5FF',
          200:  '#D4C8FF',
          400:  '#7860B8',
          500:  '#6850A8',
          600:  '#584098',
          700:  '#483088',
          800:  '#3D2878',  // primary button bg
          900:  '#2B1B47',  // primary button hover / brand deep purple
          950:  '#1A1028',  // darkest
        },
        // Ochre - CTA accent
        gold: {
          300: '#F5D468',
          400: '#EAB82A',
          500: '#D4A017',   // brand ochre
          600: '#B88514',
          700: '#8F6510',
        },
        // Violet - keep for compatibility
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
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        lift:  '0 4px 20px -2px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
        glow:  '0 0 0 3px rgb(212 160 23 / 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
