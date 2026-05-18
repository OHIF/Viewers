'use client';

import * as React from 'react';
import '../themes/themes.css';
import { themePresets } from '../themes';

const STORAGE_KEY = 'ohif:theme';
const VALID_THEMES = new Set(['default', 'custom', ...themePresets.map(p => p.name)]);

type ActiveThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ActiveThemeContext = React.createContext<ActiveThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveThemeState] = React.useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'default';
    }

    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (urlTheme && VALID_THEMES.has(urlTheme)) {
      if (urlTheme === 'default') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, urlTheme);
      }
      return urlTheme;
    }

    return localStorage.getItem(STORAGE_KEY) || 'default';
  });

  const setActiveTheme = React.useCallback((theme: string) => {
    setActiveThemeState(theme);

    const classList = document.body.classList;
    const toRemove: string[] = [];
    classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        toRemove.push(cls);
      }
    });
    toRemove.forEach(cls => classList.remove(cls));

    if (theme !== 'default' && theme !== 'custom') {
      classList.add(`theme-${theme}`);
    }

    if (theme !== 'custom') {
      const style = document.getElementById('ohif-custom-theme');
      if (style) {
        style.remove();
      }
    }

    if (theme === 'default') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, []);

  React.useEffect(() => {
    if (activeTheme !== 'default') {
      document.body.classList.add(`theme-${activeTheme}`);
    }

    return () => {
      const classList = document.body.classList;
      classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
          classList.remove(cls);
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = React.useMemo(
    () => ({ activeTheme, setActiveTheme }),
    [activeTheme, setActiveTheme]
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
