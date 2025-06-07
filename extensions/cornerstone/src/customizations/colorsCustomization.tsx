/**
 * Colors customization for the cornerstone extension
 *
 * This customization allows users to override default OHIF theme colors
 * through the extension system. Colors are defined as HSL values without
 * the hsl() wrapper (e.g., "191 74% 63%").
 *
 * Priority order:
 * 1. customization module (highest priority - extension defaults)
 * 2. built-in defaults (lowest priority - fallback)
 */

interface ColorTheme {
  [key: string]: string; // HSL string values like "191 74% 63%"
}

// Example: WILD NEON CYBER THEME for testing! 🌈
const cyberpunkNeonTheme: ColorTheme = {
  // UI-Next colors - NEON STYLE
  highlight: '320 100% 70%',
  primary: '300 100% 50%',
  neutral: '280 30% 60%',
  'neutral-light': '270 40% 80%',
  'neutral-dark': '285 50% 15%',
  background: '270 80% 8%',
  foreground: '60 100% 85%',
  card: '180 100% 15%',
  'card-foreground': '60 100% 85%',
  popover: '180 100% 20%',
  'popover-foreground': '60 100% 85%',
  'primary-foreground': '60 100% 85%',
  secondary: '200 100% 50%',
  'secondary-foreground': '60 100% 85%',
  muted: '180 80% 20%',
  'muted-foreground': '120 80% 70%',
  accent: '120 100% 50%',
  'accent-foreground': '270 80% 8%',
  destructive: '0 100% 60%',
  'destructive-foreground': '60 100% 85%',
  border: '300 100% 40%',
  input: '270 100% 25%',
  ring: '320 100% 60%',
  'chart-1': '0 100% 60%',
  'chart-2': '120 100% 50%',
  'chart-3': '240 100% 60%',
  'chart-4': '60 100% 60%',
  'chart-5': '300 100% 60%',

  // Status colors - CYBERPUNK STYLE
  'success-bg': '120 100% 20%',
  'success-border': '120 100% 40%',
  'success-text': '120 100% 70%',
  'info-bg': '180 100% 20%',
  'info-border': '180 100% 40%',
  'info-text': '180 100% 70%',
  'warning-bg': '60 100% 20%',
  'warning-border': '60 100% 40%',
  'warning-text': '60 100% 70%',
  'error-bg': '0 100% 20%',
  'error-border': '0 100% 40%',
  'error-text': '0 100% 70%',

  // Legacy UI colors - CYBERPUNK STYLE
  'aqua-pale': '180 100% 70%',
  'primary-light': '320 100% 70%',
  'primary-main': '300 100% 50%',
  'primary-dark': '270 80% 8%',
  'primary-active': '320 100% 60%',
  'inputfield-main': '270 100% 25%',
  'inputfield-disabled': '270 50% 15%',
  'inputfield-focus': '320 100% 70%',
  'inputfield-placeholder': '280 50% 30%',
  'secondary-light': '200 100% 50%',
  'secondary-main': '180 100% 40%',
  'secondary-dark': '160 100% 30%',
  'secondary-active': '140 100% 50%',
  'indigo-dark': '270 80% 8%',
  'common-bright': '60 100% 85%',
  'common-light': '120 80% 70%',
  'common-main': '60 100% 85%',
  'common-dark': '280 50% 40%',
  'common-active': '320 100% 60%',
  'bkg-low': '270 80% 5%',
  'bkg-med': '270 80% 8%',
  'bkg-full': '270 80% 12%',
  'info-primary': '60 100% 85%',
  'info-secondary': '180 100% 70%',
  'actions-primary': '300 100% 50%',
  'actions-highlight': '320 100% 70%',
  'actions-hover': '300 100% 60%',

  // Custom colors - CYBERPUNK STYLE
  'customgreen-100': '120 100% 50%',
  'customgreen-200': '140 100% 50%',
  'customblue-10': '270 80% 5%',
  'customblue-20': '270 80% 8%',
  'customblue-30': '270 80% 12%',
  'customblue-40': '270 80% 15%',
  'customblue-50': '270 80% 20%',
  'customblue-80': '240 100% 60%',
  'customblue-100': '180 100% 85%',
  'customblue-200': '200 100% 70%',
  'customblue-300': '270 80% 10%',
  'customblue-400': '240 50% 70%',
  'customgray-100': '280 50% 20%',
};

export default {
  'app.colors': cyberpunkNeonTheme,

  // You can also define colors for specific modes
  // 'app.colors.longitudinal': cyberpunkNeonTheme,
  // 'app.colors.basic': cyberpunkNeonTheme,
};
