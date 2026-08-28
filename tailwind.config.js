/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        muted: '#555555',
        page: '#F3F3F3',
        surface: '#FFFFFF',
        line: '#EAEAEA',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        photo: '12px',
      },
      boxShadow: {
        soft: '0 2px 24px rgba(17,17,17,0.06)',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
}
