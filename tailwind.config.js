// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"], // المسارات التي تحتوي على كلاسات Tailwind
  darkMode: 'class', // لتفعيل Dark Mode عبر كلاس 'dark'
  theme: {
    extend: {
      colors: {
        'brand-primary': '#007AFF', // مثال للون أساسي للشركة
        'brand-secondary': '#5856D6',
        'light-bg': '#F7F9FC',
        'dark-bg': '#1A202C',
        'dark-card': '#2D3748',
        'dark-text': '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // مثال لخط مخصص
      },
      boxShadow: {
        'interactive': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0,0,0,0.05)',
        'focus-ring': '0 0 0 3px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // لتنسيق أفضل للحقول
  ],
}
