module.exports = {
  // Note: in Tailwind 3.0, JIT will purge unused styles by default
  // but in development, it is often useful to disable this to see
  // and try out all the styles that are available.
  // ...(process.env.NODE_ENV === 'development' && {
  //   safelist: [{ pattern: /.*/ }],
  // }),
  content: ['./src/**/*.{jsx,js,ts,tsx,css,mdx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
    },
    colors: {
      overlay: 'rgba(0, 0, 0, 0.8)',
      transparent: 'transparent',
      black: '#000',
      white: '#fff',
      initial: 'initial',
      inherit: 'inherit',

      aqua: {
        pale: '#A1A1A1',
      },

      primary: {
        light: '#7b7b7b', // Gray light
        main: '#4a4a4a', // Medium gray
        dark: '#1e1e1e', // Dark gray
        active: '#8c8c8c', // Light gray
      },
      inputfield: {
        main: '#5a5a5a', // Medium gray
        disabled: '#2e2e2e', // Darker gray for disabled input
        focus: '#8c8c8c', // Light gray on focus
        placeholder: '#3a3a3a', // Slightly lighter gray
      },

      secondary: {
        light: '#8c8c8c', // Lighter gray
        main: '#4a4a4a', // Medium gray
        dark: '#2c2c2c', // Darker gray
        active: '#1e1e1e', // Dark gray
      },
      indigo: {
        dark: '#0b1a42',
      },

      common: {
        bright: '#e1e1e1', // Very light gray
        light: '#a1a1a1', // Light gray
        main: '#ffffff', // White
        dark: '#3e3e3e', // Medium dark gray
        active: '#6f6f6f', // Medium light gray
      },
      bkg: {
        low: '#1a1a1a', // Dark background
        med: '#2b2b2b', // Medium dark background
        full: '#121212', // Full dark background
      },
      info: {
        primary: '#FFFFFF', // White for info primary
        secondary: '#A1A1A1', // Light gray for info secondary
      },
      actions: {
        primary: '#8c8c8c', // Light gray for primary action
        highlight: '#b0b0b0', // Brighter gray for highlight
        hover: 'rgba(140, 140, 140, 0.2)', // Light gray hover effect
      },
      customgreen: {
        100: '#6c6c6c', // Custom dark gray
        200: '#888888', // Custom lighter gray
      },

      customblue: {
        10: '#212121', // Very dark gray
        20: '#2a2a2a', // Darker gray
        30: '#333333', // Dark gray
        40: '#3c3c3c', // Dark gray
        50: '#444444', // Medium dark gray
        80: '#505050', // Medium gray
        100: '#b0b0b0', // Light gray
        200: '#c6c6c6', // Lighter gray
        300: '#d1d1d1', // Very light gray
        400: '#e2e2e2', // Almost white gray
      },

      customgray: {
        100: '#3e3e3e', // Dark gray
      },

      gray: {
        100: '#f7fafc', // Very light gray
        200: '#edf2f7', // Light gray
        300: '#e2e8f0', // Slightly darker gray
        400: '#cbd5e0', // Medium light gray
        500: '#a0aec0', // Medium gray
        600: '#718096', // Darker gray
        700: '#4a5568', // Darker gray
        800: '#2d3748', // Very dark gray
        900: '#1a202c', // Almost black
      },
      red: {
        100: '#fff5f5', // Very light red
        200: '#fed7d7', // Light red
        300: '#feb2b2', // Soft red
        400: '#fc8181', // Light red
        500: '#f56565', // Medium red
        600: '#e53e3e', // Dark red
        700: '#c53030', // Darker red
        800: '#9b2c2c', // Very dark red
        900: '#742a2a', // Almost black red
      },
      orange: {
        100: '#fffaf0', // Very light orange
        200: '#feebc8', // Light orange
        300: '#fbd38d', // Soft orange
        400: '#f6ad55', // Medium orange
        500: '#ed8936', // Medium orange
        600: '#dd6b20', // Dark orange
        700: '#c05621', // Darker orange
        800: '#9c4221', // Very dark orange
        900: '#7b341e', // Almost black orange
      },
      yellow: {
        100: '#fffff0', // Very light yellow
        200: '#fefcbf', // Light yellow
        300: '#faf089', // Soft yellow
        400: '#f6e05e', // Medium yellow
        500: '#ecc94b', // Medium yellow
        600: '#d69e2e', // Dark yellow
        700: '#b7791f', // Darker yellow
        800: '#975a16', // Very dark yellow
        900: '#744210', // Almost black yellow
      },
      green: {
        100: '#f0fff4', // Very light green
        200: '#c6f6d5', // Light green
        300: '#9ae6b4', // Soft green
        400: '#68d391', // Medium green
        500: '#48bb78', // Medium green
        600: '#38a169', // Dark green
        700: '#2f855a', // Darker green
        800: '#276749', // Very dark green
        900: '#22543d', // Almost black green
      },
      teal: {
        100: '#e6fffa', // Very light teal
        200: '#b2f5ea', // Light teal
        300: '#81e6d9', // Soft teal
        400: '#4fd1c5', // Medium teal
        500: '#38b2ac', // Medium teal
        600: '#319795', // Dark teal
        700: '#2c7a7b', // Darker teal
        800: '#285e61', // Very dark teal
        900: '#234e52', // Almost black teal
      },
      blue: {
        100: '#ebf8ff', // Very light blue
        200: '#bee3f8', // Light blue
        300: '#90cdf4', // Soft blue
        400: '#63b3ed', // Medium blue
        500: '#4299e1', // Medium blue
        600: '#3182ce', // Dark blue
        700: '#2b6cb0', // Darker blue
        800: '#2c5282', // Very dark blue
        900: '#2a4365', // Almost black blue
      },
      indigo: {
        100: '#ebf4ff', // Very light indigo
        200: '#c3dafe', // Light indigo
        300: '#a3bffa', // Soft indigo
        400: '#7f9cf5', // Medium indigo
        500: '#667eea', // Medium indigo
        600: '#5a67d8', // Dark indigo
        700: '#4c51bf', // Darker indigo
        800: '#434190', // Very dark indigo
        900: '#3c366b', // Almost black indigo
        dark: '#7F7F7F', // Very dark indigo
      },
      purple: {
        100: '#faf5ff', // Very light purple
        200: '#e9d8fd', // Light purple
        300: '#d6bcfa', // Soft purple
        400: '#b794f4', // Medium purple
        500: '#9f7aea', // Medium purple
        600: '#805ad5', // Dark purple
        700: '#6b46c1', // Darker purple
        800: '#553c9a', // Very dark purple
        900: '#44337a', // Almost black purple
      },
      pink: {
        100: '#fff5f7', // Very light pink
        200: '#fed7e2', // Light pink
        300: '#fbb6ce', // Soft pink
        400: '#f687b3', // Medium pink
        500: '#ed64a6', // Medium pink
        600: '#d53f8c', // Dark pink
        700: '#b83280', // Darker pink
        800: '#97266d', // Very dark pink
        900: '#702459', // Almost black pink
      },
    },
    backgroundColor: theme => theme('colors'),
    backgroundPosition: {
      bottom: 'bottom',
      center: 'center',
      left: 'left',
      'left-bottom': 'left bottom',
      'left-top': 'left top',
      right: 'right',
      'right-bottom': 'right bottom',
      'right-top': 'right top',
      top: 'top',
    },
    backgroundSize: {
      auto: 'auto',
      cover: 'cover',
      contain: 'contain',
    },
    borderColor: theme => ({
      ...theme('colors'),
      DEFAULT: theme('colors.gray.300', 'currentColor'),
    }),
    boxShadow: {
      xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      none: 'none',
    },
    container: {},
    cursor: {
      auto: 'auto',
      default: 'default',
      pointer: 'pointer',
      wait: 'wait',
      text: 'text',
      move: 'move',
      'not-allowed': 'not-allowed',
    },
    fill: {
      current: 'currentColor',
    },
    fontSize: {
      xxs: '0.6875rem', // 11px
      xs: '0.75rem', // 12px
      sm: '0.8125rem', // 13px
      base: '0.875rem', // 14px
      lg: '1rem', // 16px
      xl: '1.125rem', // 18px
      '2xl': '1.25rem', // 20px
      '3xl': '1.375rem', // 22px
      '4xl': '1.5rem', // 24px
      '5xl': '1.875rem', // 30px
    },
    flex: {
      1: '1 1 0%',
      0.3: '0.3 0.3 0%',
      0.5: '0.5 0.5 0%',
      auto: '1 1 auto',
      initial: '0 1 auto',
      none: 'none',
      static: '0 0 auto',
    },
    flexGrow: {
      0: '0',
      DEFAULT: '1',
    },
    flexShrink: {
      0: '0',
      DEFAULT: '1',
    },
    fontWeight: {
      hairline: '100',
      thin: '200',
      light: '300',
      normal: '300',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    height: theme => ({
      auto: 'auto',
      ...theme('spacing'),
      full: '100%',
      screen: '100vh',
    }),
    inset: theme => ({
      ...theme('spacing'),
      0: '0',
      auto: 'auto',
      full: '100%',
      viewport: '0.5rem',
      '1/2': '50%',
      'viewport-scrollbar': '1.3rem',
    }),
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
      3: '.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
    },
    margin: (theme, { negative }) => ({
      auto: 'auto',
      ...theme('spacing'),
      ...negative(theme('spacing')),
    }),
    maxHeight: theme => ({
      full: '100%',
      screen: '100vh',
      ...theme('spacing'),
    }),
    maxWidth: (theme, { breakpoints }) => ({
      none: 'none',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
      full: '100%',
      ...breakpoints(theme('screens')),
      ...theme('spacing'),
    }),
    minHeight: theme => ({
      ...theme('spacing'),
      0: '0',
      full: '100%',
      screen: '100vh',
    }),
    minWidth: theme => ({
      ...theme('spacing'),
      0: '0',
      xs: '2rem',
      sm: '4rem',
      md: '6rem',
      lg: '8rem',
      xl: '10rem',
      full: '100%',
    }),
    objectPosition: {
      bottom: 'bottom',
      center: 'center',
      left: 'left',
      'left-bottom': 'left bottom',
      'left-top': 'left top',
      right: 'right',
      'right-bottom': 'right bottom',
      'right-top': 'right top',
      top: 'top',
    },
    opacity: {
      0: '0',
      5: '.5',
      10: '.10',
      15: '.15',
      20: '.20',
      25: '.25',
      30: '.30',
      35: '.35',
      40: '.40',
      45: '.45',
      50: '.50',
      55: '.55',
      60: '.60',
      65: '.65',
      70: '.70',
      75: '.75',
      80: '.80',
      85: '.85',
      90: '.90',
      95: '.95',
      100: '1',
    },
    order: {
      first: '-9999',
      last: '9999',
      none: '0',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
    },
    padding: theme => theme('spacing'),
    placeholderColor: theme => theme('colors'),
    stroke: theme => ({
      ...theme('colors'),
      current: 'currentColor',
    }),
    strokeWidth: {
      0: '0',
      1: '1',
      2: '2',
    },
    textColor: theme => theme('colors'),
    width: theme => ({
      auto: 'auto',
      ...theme('spacing'),
      '1/2': '50%',
      '1/3': '33.333333%',
      '2/3': '66.666667%',
      '1/4': '25%',
      '2/4': '50%',
      '3/4': '75%',
      '1/5': '20%',
      '2/5': '40%',
      '3/5': '60%',
      '4/5': '80%',
      '1/6': '16.666667%',
      '2/6': '33.333333%',
      '3/6': '50%',
      '4/6': '66.666667%',
      '5/6': '83.333333%',
      '1/12': '8.333333%',
      '2/12': '16.666667%',
      '3/12': '25%',
      '4/12': '33.333333%',
      '5/12': '41.666667%',
      '6/12': '50%',
      '7/12': '58.333333%',
      '8/12': '66.666667%',
      '9/12': '75%',
      '10/12': '83.333333%',
      '11/12': '91.666667%',
      '1/24': '4.166666667%',
      '2/24': '8.333333333%',
      '3/24': '12.5%',
      '4/24': '16.66666667%',
      '5/24': '20.83333333%',
      '6/24': '25%',
      '7/24': '29.16666667%',
      '8/24': '33.33333333%',
      '9/24': '37.5%',
      '10/24': '41.66666667%',
      '11/24': '45.83333333%',
      '12/24': '50%',
      '13/24': '54.16666667%',
      '14/24': '58.33333333%',
      '15/24': '62.5%',
      '16/24': '66.66666667%',
      '17/24': '70.83333333%',
      '18/24': '75%',
      '19/24': '79.16666667%',
      '20/24': '83.33333333%',
      '21/24': '87.5%',
      '22/24': '91.66666667%',
      '23/24': '95.83333333%',
      full: '100%',
      screen: '100vw',
      'max-content': 'max-content',
    }),
    zIndex: {
      auto: 'auto',
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
    },
    gap: theme => theme('spacing'),
    gridTemplateColumns: {
      none: 'none',
      1: 'repeat(1, minmax(0, 1fr))',
      2: 'repeat(2, minmax(0, 1fr))',
      3: 'repeat(3, minmax(0, 1fr))',
      4: 'repeat(4, minmax(0, 1fr))',
      5: 'repeat(5, minmax(0, 1fr))',
      6: 'repeat(6, minmax(0, 1fr))',
      7: 'repeat(7, minmax(0, 1fr))',
      8: 'repeat(8, minmax(0, 1fr))',
      9: 'repeat(9, minmax(0, 1fr))',
      10: 'repeat(10, minmax(0, 1fr))',
      11: 'repeat(11, minmax(0, 1fr))',
      12: 'repeat(12, minmax(0, 1fr))',
    },
    gridColumn: {
      auto: 'auto',
      'span-1': 'span 1 / span 1',
      'span-2': 'span 2 / span 2',
      'span-3': 'span 3 / span 3',
      'span-4': 'span 4 / span 4',
      'span-5': 'span 5 / span 5',
      'span-6': 'span 6 / span 6',
      'span-7': 'span 7 / span 7',
      'span-8': 'span 8 / span 8',
      'span-9': 'span 9 / span 9',
      'span-10': 'span 10 / span 10',
      'span-11': 'span 11 / span 11',
      'span-12': 'span 12 / span 12',
    },
    gridColumnStart: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
      13: '13',
    },
    gridColumnEnd: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
      8: '8',
      9: '9',
      10: '10',
      11: '11',
      12: '12',
      13: '13',
    },
    gridTemplateRows: {
      none: 'none',
      1: 'repeat(1, minmax(0, 1fr))',
      2: 'repeat(2, minmax(0, 1fr))',
      3: 'repeat(3, minmax(0, 1fr))',
      4: 'repeat(4, minmax(0, 1fr))',
      5: 'repeat(5, minmax(0, 1fr))',
      6: 'repeat(6, minmax(0, 1fr))',
    },
    gridRow: {
      auto: 'auto',
      'span-1': 'span 1 / span 1',
      'span-2': 'span 2 / span 2',
      'span-3': 'span 3 / span 3',
      'span-4': 'span 4 / span 4',
      'span-5': 'span 5 / span 5',
      'span-6': 'span 6 / span 6',
    },
    gridRowStart: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
    },
    gridRowEnd: {
      auto: 'auto',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '5',
      6: '6',
      7: '7',
    },
    transformOrigin: {
      center: 'center',
      top: 'top',
      'top-right': 'top right',
      right: 'right',
      'bottom-right': 'bottom right',
      bottom: 'bottom',
      'bottom-left': 'bottom left',
      left: 'left',
      'top-left': 'top left',
    },
    scale: {
      0: '0',
      50: '.5',
      75: '.75',
      90: '.9',
      95: '.95',
      100: '1',
      105: '1.05',
      110: '1.1',
      125: '1.25',
      150: '1.5',
    },
    rotate: {
      '-180': '-180deg',
      '-90': '-90deg',
      '-45': '-45deg',
      0: '0',
      45: '45deg',
      90: '90deg',
      180: '180deg',
    },
    translate: (theme, { negative }) => ({
      ...theme('spacing'),
      ...negative(theme('spacing')),
      '-full': '-100%',
      '-1/2': '-50%',
      '1/2': '50%',
      full: '100%',
    }),
    skew: {
      '-12': '-12deg',
      '-6': '-6deg',
      '-3': '-3deg',
      0: '0',
      3: '3deg',
      6: '6deg',
      12: '12deg',
    },
    transitionProperty: {
      none: 'none',
      all: 'all',
      height: 'height',
      DEFAULT:
        'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      colors: 'background-color, border-color, color, fill, stroke',
      opacity: 'opacity',
      shadow: 'box-shadow',
      transform: 'transform',
    },
    transitionTimingFunction: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    transitionDuration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
  },
  variants: {
    accessibility: ['responsive', 'focus'],
    alignContent: ['responsive'],
    alignItems: ['responsive'],
    alignSelf: ['responsive'],
    appearance: ['responsive'],
    backgroundAttachment: ['responsive'],
    backgroundColor: ['responsive', 'hover', 'focus', 'active', 'group-focus', 'group-hover'],
    backgroundPosition: ['responsive'],
    backgroundRepeat: ['responsive'],
    backgroundSize: ['responsive'],
    borderCollapse: ['responsive'],
    borderColor: ['responsive', 'hover', 'focus', 'active', 'group-focus', 'group-hover'],
    borderRadius: ['responsive', 'focus', 'first', 'last'],
    borderStyle: ['responsive', 'focus'],
    borderWidth: ['responsive', 'focus', 'first', 'last'],
    boxShadow: ['responsive', 'hover', 'focus'],
    boxSizing: ['responsive'],
    cursor: ['responsive'],
    display: ['responsive'],
    fill: ['responsive'],
    flex: ['responsive'],
    flexDirection: ['responsive'],
    flexGrow: ['responsive'],
    flexShrink: ['responsive'],
    flexWrap: ['responsive'],
    float: ['responsive'],
    clear: ['responsive'],
    fontFamily: ['responsive'],
    fontSize: ['responsive'],
    fontSmoothing: ['responsive'],
    fontStyle: ['responsive'],
    fontWeight: ['responsive', 'hover', 'focus'],
    height: ['responsive'],
    inset: ['responsive'],
    justifyContent: ['responsive'],
    letterSpacing: ['responsive'],
    lineHeight: ['responsive'],
    listStylePosition: ['responsive'],
    listStyleType: ['responsive'],
    margin: ['responsive'],
    maxHeight: ['responsive'],
    maxWidth: ['responsive'],
    minHeight: ['responsive'],
    minWidth: ['responsive'],
    objectFit: ['responsive'],
    objectPosition: ['responsive'],
    opacity: ['responsive', 'hover', 'focus', 'active'],
    order: ['responsive'],
    outline: ['responsive', 'focus'],
    overflow: ['responsive'],
    padding: ['responsive', 'first'],
    placeholderColor: ['responsive', 'focus'],
    pointerEvents: ['responsive'],
    position: ['responsive'],
    resize: ['responsive'],
    stroke: ['responsive'],
    strokeWidth: ['responsive'],
    tableLayout: ['responsive'],
    textAlign: ['responsive'],
    textColor: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
    textDecoration: ['responsive', 'hover', 'focus'],
    textTransform: ['responsive'],
    userSelect: ['responsive'],
    verticalAlign: ['responsive'],
    visibility: ['responsive'],
    whitespace: ['responsive'],
    width: ['responsive'],
    wordBreak: ['responsive'],
    zIndex: ['responsive'],
    gap: ['responsive'],
    gridAutoFlow: ['responsive'],
    gridTemplateColumns: ['responsive'],
    gridColumn: ['responsive'],
    gridColumnStart: ['responsive'],
    gridColumnEnd: ['responsive'],
    gridTemplateRows: ['responsive'],
    gridRow: ['responsive'],
    gridRowStart: ['responsive'],
    gridRowEnd: ['responsive'],
    transform: ['responsive'],
    transformOrigin: ['responsive'],
    scale: ['responsive', 'hover', 'focus'],
    rotate: ['responsive', 'hover', 'focus'],
    translate: ['responsive', 'hover', 'focus'],
    skew: ['responsive', 'hover', 'focus'],
    transitionProperty: ['responsive'],
    transitionTimingFunction: ['responsive'],
    transitionDuration: ['responsive'],
  },
  corePlugins: {},
  plugins: [],
};
