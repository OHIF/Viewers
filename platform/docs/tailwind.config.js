module.exports = {
  corePlugins: {
    preflight: false, // disable Tailwind's reset
  },
  content: ['./src/**/*.{js,jsx,ts,tsx,css}', './docs/**/*.jsx', './docs/**/*.mdx'],
  theme: {
    extend: {
      colors: {
        'ohif-blue': '#007aff',
      },
    },
  },
  variants: {},
  plugins: [],
};
