const STYLE_ID = 'ohif-custom-theme';
const STORAGE_KEY_CSS = 'ohif:custom-theme-css';
const STORAGE_KEY_OPEN = 'ohif:custom-theme-open';

export function injectCustomTheme(cssText: string): void {
  const vars: string[] = [];

  for (const raw of cssText.split('\n')) {
    const line = raw.trim();
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      continue;
    }

    const name = line.slice(0, colonIdx).trim();
    if (!/^--[a-zA-Z0-9-]+$/.test(name)) {
      continue;
    }

    const value = line
      .slice(colonIdx + 1)
      .replace(/[{};]/g, '')
      .trim();
    if (!value) {
      continue;
    }

    vars.push(`  ${name}: ${value};`);
  }

  if (vars.length === 0) {
    return;
  }
  const block = vars.join('\n');
  const css = `:root {\n${block}\n}\n.dark {\n${block}\n}`;

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
