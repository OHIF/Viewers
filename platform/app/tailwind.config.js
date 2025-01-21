/** @type {import('tailwindcss').Config} */
module.exports = {
  // Note: in Tailwind 3.0, JIT will purge unused styles by default
  // but in development, it is often useful to disable this to see
  // and try out all the styles that are available.
  // ...(process.env.NODE_ENV === 'development' && {
  //   safelist: [{ pattern: /.*/ }],
  // }),
  presets: [require('../ui/tailwind.config.js'), require('../ui-next/tailwind.config.js')],
  content: [
    './src/**/*.{jsx,js,ts,tsx, css}',
    '../../extensions/**/*.{jsx,js,ts,tsx, css}',
    '../ui/src/**/*.{jsx,js,ts,tsx, css}',
    '../../modes/**/*.{jsx,js,ts,tsx, css}',
    './node_modules/@ohif/ui/src/**/*.{js,jsx,ts,tsx, css}',
    '../../node_modules/@ohif/ui/src/**/*.{js,jsx,ts,tsx,css}',
    '../../node_modules/@ohif/ui-next/src/**/*.{js,jsx,ts,tsx,css}',
    '../../node_modules/@ohif/extension-*/src/**/*.{js,jsx,css, ts,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      mono: ['Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
    },
    fontSize: {
      xs: '0.65rem',
      sm: '0.75rem',
      base: '0.8125rem',
      lg: '0.9275rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
  },
};
