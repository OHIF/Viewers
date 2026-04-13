const DENTAL_THEME_CLASS = 'dental-theme' as const;
const STORAGE_KEY = 'dentalThemeActive';

type ThemeListener = () => void;

const listeners = new Set<ThemeListener>();

function notifyListeners(): void {
  listeners.forEach(fn => fn());
}

function subscribe(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isActive(): boolean {
  return document.documentElement.classList.contains(DENTAL_THEME_CLASS);
}

function setActive(active: boolean): void {
  if (active === isActive()) return;

  if (active) {
    document.documentElement.classList.add(DENTAL_THEME_CLASS);
  } else {
    document.documentElement.classList.remove(DENTAL_THEME_CLASS);
  }

  try {
    localStorage.setItem(STORAGE_KEY, String(active));
  } catch {
    // storage unavailable — ignore
  }

  notifyListeners();
}

function restore(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      document.documentElement.classList.add(DENTAL_THEME_CLASS);
    }
  } catch {
    // storage unavailable — ignore
  }
}

function reset(): void {
  if (isActive()) {
    document.documentElement.classList.remove(DENTAL_THEME_CLASS);
    notifyListeners();
  }
}

restore();

export const dentalThemeManager = {
  DENTAL_THEME_CLASS,
  isActive,
  setActive,
  subscribe,
  reset,
  restore,
} as const;
