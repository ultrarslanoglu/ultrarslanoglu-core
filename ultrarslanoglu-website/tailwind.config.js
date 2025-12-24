/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        galatasaray: {
          yellow: '#FFCD00',
          red: '#FE4646',
          dark: '#1a1a1a',
          light: '#f5f5f5',
          gray: '#999999',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
        heading: ['Arial', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 205, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
