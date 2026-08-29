/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark-blue': '#2A0845',
        'brand-purple': '#2A0845',
        'brand-purple-dark': '#1B0629',
        'brand-purple-light': '#6B21A8',
        'brand-beige': '#FAF6F0',
        'brand-beige-darker': '#F3ECE2',
        'brand-cream': '#FAF6F0',
        'brand-cream-light': '#FFFDF9',
        'brand-gold': '#D4AF37',
        'brand-accent': '#8B5CF6',
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
