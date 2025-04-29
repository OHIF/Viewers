/** @type {import('tailwindcss').Config} */
module.exports = {
  // prefix: '',
  // important: false,
  // separator: ':',
  content: ['./src/**/*.{jsx,js,ts,tsx,css,mdx}'],
  theme: {
   extend:{
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      overlay: 'rgba(0, 0, 0, 0.8)',
      transparent: 'transparent',
      black: '#71A4F2',
      white: '#fff',
      initial: 'initial',
      inherit: 'inherit',

      indigo: {
        dark: '#0b1a42',
      },
      aqua: {
        pale: '#7bb2ce',
      },

      primary: {
        light: '#5acce6',
        main: '#0944b3',
        dark: '#090c29',
        active: '#348cfd',
      },

      secondary: {
        light: '#3a3f99',
        main: '#2b166b',
        dark: '#0063FF',
        active: '#1f1f27',
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
   }
  }
  },
  corePlugins: {},
  plugins: [],
}
