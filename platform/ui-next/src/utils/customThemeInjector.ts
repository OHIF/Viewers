const STYLE_ID = 'ohif-custom-theme';
const STORAGE_KEY_CSS = 'ohif:custom-theme-css';
const STORAGE_KEY_OPEN = 'ohif:custom-theme-open';

export function injectCustomTheme(cssText: string): void {
  const lines = cssText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('--') && l.includes(':'));

  if (lines.length === 0) {
    return;
  }

  const vars = lines.map(l => `  ${l.endsWith(';') ? l : l + ';'}`).join('\n');
  const css = `:root {\n${vars}\n}\n.dark {\n${vars}\n}`;

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;

  localStorage.setItem(STORAGE_KEY_CSS, cssText);
}

export function clearCustomTheme(): void {
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
  localStorage.removeItem(STORAGE_KEY_CSS);
  localStorage.removeItem(STORAGE_KEY_OPEN);
}
