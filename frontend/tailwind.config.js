/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        paper: '#FFFFFF',
        line: '#1F1F1F',
        graphite: {
          950: '#0A0A0A',
          900: '#151515',
          800: '#262626',
          700: '#404040',
          600: '#525252',
          500: '#737373',
          400: '#A3A3A3',
          300: '#D4D4D4',
          200: '#E5E5E5',
          100: '#F2F2F2',
          50: '#FAFAFA',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        widest2: '.18em',
      },
      boxShadow: {
        hard: '4px 4px 0 0 #0A0A0A',
        'hard-sm': '2px 2px 0 0 #0A0A0A',
      },
    },
  },
  plugins: [],
}
