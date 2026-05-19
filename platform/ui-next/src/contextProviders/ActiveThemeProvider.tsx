import * as React from 'react';
import '../themes/themes.css';
import { themePresets } from '../themes';

const STORAGE_KEY_THEME = 'ohif:theme';
const STORAGE_KEY_CUSTOM_CSS = 'ohif:custom-theme-css';
const CUSTOM_STYLE_ID = 'ohif-custom-theme';
const VALID_THEMES = new Set(['default', 'custom', ...themePresets.map(p => p.name)]);

type ActiveThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  customCss: string;
  applyCustomTheme: (cssText: string) => void;
  clearCustomTheme: () => void;
};

const ActiveThemeContext = React.createContext<ActiveThemeContextType | undefined>(undefined);

function removeThemeClasses() {
  const classList = document.body.classList;
  const toRemove: string[] = [];
  classList.forEach(cls => {
    if (cls.startsWith('theme-')) {
      toRemove.push(cls);
    }
  });
  toRemove.forEach(cls => classList.remove(cls));
}

function removeCustomStyleElement() {
  const style = document.getElementById(CUSTOM_STYLE_ID);
  if (style) {
    style.remove();
  }
}

function parseCssVars(cssText: string): string[] {
  const vars: string[] = [];

  for (const raw of cssText.split('\n')) {
    const line = raw.trim();
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const name = line.slice(0, colonIdx).trim();
    if (!/^--[a-zA-Z0-9-]+$/.test(name)) continue;

    const value = line
      .slice(colonIdx + 1)
      .replace(/[{};]/g, '')
      .trim();
    if (!value) continue;

    vars.push(`  ${name}: ${value};`);
  }

  return vars;
}

function injectCustomStyles(vars: string[]) {
  const block = vars.join('\n');
  const css = `:root {\n${block}\n}\n.dark {\n${block}\n}`;

  let style = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = CUSTOM_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

export function ActiveThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveThemeState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (urlTheme && VALID_THEMES.has(urlTheme)) return urlTheme;
    return localStorage.getItem(STORAGE_KEY_THEME) || 'default';
  });

  const [customCss, setCustomCssState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_CUSTOM_CSS) || '';
  });

  const setActiveTheme = React.useCallback((theme: string) => {
    if (!VALID_THEMES.has(theme)) return;

    setActiveThemeState(theme);
    removeThemeClasses();

    if (theme !== 'default' && theme !== 'custom') {
      document.body.classList.add(`theme-${theme}`);
    }

    if (theme !== 'custom') {
      removeCustomStyleElement();
    }

    if (theme === 'default') {
      localStorage.removeItem(STORAGE_KEY_THEME);
    } else {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    }
  }, []);

  const applyCustomTheme = React.useCallback((cssText: string) => {
    const vars = parseCssVars(cssText);
    if (vars.length === 0) return;

    injectCustomStyles(vars);

    setCustomCssState(cssText);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CSS, cssText);

    setActiveThemeState('custom');
    removeThemeClasses();
    localStorage.setItem(STORAGE_KEY_THEME, 'custom');
  }, []);

  const clearCustomTheme = React.useCallback(() => {
    removeCustomStyleElement();

    setCustomCssState('');
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CSS);

    setActiveThemeState('default');
    removeThemeClasses();
    localStorage.removeItem(STORAGE_KEY_THEME);
  }, []);

  // Persist URL param override to localStorage
  React.useEffect(() => {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (urlTheme && VALID_THEMES.has(urlTheme)) {
      if (urlTheme === 'default') {
        localStorage.removeItem(STORAGE_KEY_THEME);
      } else {
        localStorage.setItem(STORAGE_KEY_THEME, urlTheme);
      }
    }
  }, []);

  // Apply initial theme on mount (including custom theme re-injection on reload)
  React.useEffect(() => {
    if (activeTheme === 'custom' && customCss) {
      applyCustomTheme(customCss);
    } else if (activeTheme !== 'default') {
      document.body.classList.add(`theme-${activeTheme}`);
    }

    return () => {
      removeThemeClasses();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = React.useMemo(
    () => ({ activeTheme, setActiveTheme, customCss, applyCustomTheme, clearCustomTheme }),
    [activeTheme, setActiveTheme, customCss, applyCustomTheme, clearCustomTheme]
  );

  return <ActiveThemeContext.Provider value={value}>{children}</ActiveThemeContext.Provider>;
}

export function useActiveTheme() {
  const context = React.useContext(ActiveThemeContext);
  if (context === undefined) {
    throw new Error('useActiveTheme must be used within an ActiveThemeProvider');
  }
  return context;
}
