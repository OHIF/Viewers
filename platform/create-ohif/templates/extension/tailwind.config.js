/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    // A runtime-injected stylesheet must never reset host styles.
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
