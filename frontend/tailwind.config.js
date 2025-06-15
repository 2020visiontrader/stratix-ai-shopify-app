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
        'stratix-purple': '#8b5cf6',
        'stratix-blue': '#3d5afe',
        'stratix-lavender': '#bfa3e3',
      },
    },
  },
  plugins: [],
};
