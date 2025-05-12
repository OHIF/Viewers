/** @type {import('tailwindcss').Config} */
module.exports = {
  // prefix: '',
  // important: false,
  // separator: ':',
  content: ['./src/**/*.{jsx,js,ts,tsx,css,mdx}'],
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        overlay: 'rgba(0, 0, 0, 0.8)',
        transparent: 'transparent',
        black: '#000',
        white: '#fff',
        dark: '#090c29',
        light: '#f5f5f5',
        initial: 'initial',
        inherit: 'inherit',

        indigo: {
          dark: '#0b1a42',
        },
        aqua: {
          pale: '#7bb2ce',
        },

        primary: {
          DEFAULT: '#fff',
          light: '#9bcefb',
          main: '#83c6fb',
          dark: '#0D316B',
          active: '#090c29',
        },
        secondary: {
          light: '#e2f2ff',
          main: '#0F49A0',
          dark: '#053684',
          active: '#090c29',
        },
        common: {
          bright: '#e1e1e1',
          light: '#a19fad',
          main: '#fff',
          dark: '#726f7e',
          active: '#2c3074',
        },

        customgreen: {
          100: '#05D97C',
        },

        customblue: {
          100: '#c4fdff',
          200: '#38daff',
        },
      },
      transitionProperty: {
        height: 'height',
      },
    },
  },
  corePlugins: {},
  plugins: [],
};
