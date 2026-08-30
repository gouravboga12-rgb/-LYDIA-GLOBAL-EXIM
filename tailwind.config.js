/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark-blue': '#45055B',
        'brand-purple': '#45055B',
        'brand-purple-dark': '#26002B',
        'brand-purple-light': '#70148D',
        'brand-beige': '#FAF6F0',
        'brand-beige-darker': '#F3ECE2',
        'brand-cream': '#FAF6F0',
        'brand-cream-light': '#FFFDF9',
        'brand-gold': '#D4AF37',
        'brand-accent': '#8F2BAE',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
      }
    },
  },
  plugins: [],
}
