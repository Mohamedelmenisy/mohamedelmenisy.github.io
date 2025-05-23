/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode using the 'dark' class
  content: [
    "./*.html",
    "./**/*.html",
    "./js/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        'primary-indigo': {
          light: '#6366f1',
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
        },
        'gradient-start': '#6b7280',
        'gradient-end': '#1f2937',
      },
      backgroundImage: {
        'gradient-135': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-45': 'linear-gradient(45deg, var(--tw-gradient-stops))',
        'gradient-90': 'linear-gradient(90deg, var(--tw-gradient-stops))',
        'gradient-180': 'linear-gradient(180deg, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'custom-lg': '0 10px 30px rgba(0, 0, 0, 0.3)',
        'custom-xl': '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.5s ease forwards',
        'focusPulse': 'focusPulse 2s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        focusPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 0 10px rgba(99, 102, 241, 0)' },
        },
      },
    },
  },
  plugins: [],
}
