export const defaultColors = {
  // UI-Next colors
  highlight: '191 74% 63%',
  neutral: '213 22% 59%',
  'neutral-light': '214 69% 81%',
  'neutral-dark': '214 16% 21%',
  background: '236 62% 5%',
  foreground: '0 0% 98%',
  card: '234 64% 10%',
  'card-foreground': '0 0% 98%',
  popover: '219 90% 15%',
  'popover-foreground': '0 0% 98%',
  primary: '214 98% 60%',
  'primary-foreground': '0 0% 98%',
  secondary: '214 66% 48%',
  'secondary-foreground': '200 50% 84%',
  muted: '234 64% 10%',
  'muted-foreground': '200 46% 65%',
  accent: '217 79% 24%',
  'accent-foreground': '0 0% 98%',
  destructive: '0 62.8% 30.6%',
  'destructive-foreground': '0 0% 98%',
  border: '0 0% 14.9%',
  input: '236 52% 30%',
  ring: '214 98% 60%',
  'chart-1': '220 70% 50%',
  'chart-2': '160 60% 45%',
  'chart-3': '30 80% 55%',
  'chart-4': '280 65% 60%',
  'chart-5': '340 75% 55%',

  // Legacy UI colors (converted to HSL)
  'aqua-pale': '203 35% 63%',
  'primary-light': '191 74% 63%',
  'primary-main': '221 92% 36%',
  'primary-dark': '225 78% 12%',
  'primary-active': '214 98% 60%',
  'inputfield-main': '242 47% 42%',
  'inputfield-disabled': '252 66% 28%',
  'inputfield-focus': '191 74% 63%',
  'inputfield-placeholder': '258 5% 23%',
  'secondary-light': '242 47% 42%',
  'secondary-main': '252 66% 28%',
  'secondary-dark': '218 75% 16%',
  'secondary-active': '246 11% 15%',
  'indigo-dark': '217 74% 16%',
  'common-bright': '0 0% 88%',
  'common-light': '261 12% 68%',
  'common-main': '0 0% 100%',
  'common-dark': '257 9% 64%',
  'common-active': '242 47% 44%',
  'bkg-low': '225 87% 4%',
  'bkg-med': '225 78% 12%',
  'bkg-full': '218 75% 16%',
  'info-primary': '0 0% 100%',
  'info-secondary': '203 35% 63%',
  'actions-primary': '214 98% 60%',
  'actions-highlight': '191 74% 63%',
  'actions-hover': '214 100% 60%',
  'customgreen-100': '156 95% 44%',
  'customgreen-200': '156 89% 46%',
  'customblue-10': '225 73% 15%',
  'customblue-20': '222 72% 19%',
  'customblue-30': '221 81% 23%',
  'customblue-40': '219 82% 28%',
  'customblue-50': '217 83% 32%',
  'customblue-80': '215 84% 46%',
  'customblue-100': '181 100% 89%',
  'customblue-200': '194 100% 62%',
  'customblue-300': '236 41% 21%',
  'customblue-400': '220 26% 67%',
  'customgray-100': '237 25% 20%',
};

export interface ColorTheme {
  [key: string]: string; // HSL string values like "191 74% 63%"
}

export function applyColorTheme(colors: ColorTheme) {
  const root = document.documentElement;

  Object.entries(colors).forEach(([colorName, hslValue]) => {
    const cssVarName = `--${colorName}`;
    root.style.setProperty(cssVarName, hslValue);
  });
}

export function initializeColors(customizationColors?: ColorTheme) {
  if (customizationColors) {
    applyColorTheme(customizationColors);
  } else {
    applyColorTheme(defaultColors);
  }
}
