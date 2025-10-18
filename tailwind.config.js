/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['NotoSansArabic', 'sans-serif'],
        'arabic-bold': ['NotoSansArabic-Bold', 'sans-serif'],
        'arabic-medium': ['NotoSansArabic-Medium', 'sans-serif'],
      },
      colors: {
        'qatar-blue': '#1E90FF',
        'qatar-white': '#FFFFFF',
        'qatar-gray': '#F5F5F5',
        'qatar-dark': '#2C3E50',
        'qatar-success': '#27AE60',
        'qatar-warning': '#F39C12',
        'qatar-error': '#E74C3C',
      },
      spacing: {
        '12': '48px', // 48dp touch target
        '16': '64px',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};
