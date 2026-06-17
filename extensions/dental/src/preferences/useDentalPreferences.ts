import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_DENTAL_PREFERENCES,
  DENTAL_PREFERENCES_STORAGE_KEY,
  DentalPreferences,
  DentalThemePreference,
  normalizeDentalPreferences,
} from './dentalPreferences';
import { ToothNumberingSystem, getToothIdentityById } from '../tooth/toothIdentity';

function readStoredPreferences(): DentalPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_DENTAL_PREFERENCES;
  }

  const stored = window.localStorage.getItem(DENTAL_PREFERENCES_STORAGE_KEY);

  if (!stored) {
    return DEFAULT_DENTAL_PREFERENCES;
  }

  try {
    return normalizeDentalPreferences(JSON.parse(stored));
  } catch {
    return DEFAULT_DENTAL_PREFERENCES;
  }
}

export function useDentalPreferences() {
  const [preferences, setPreferences] = useState<DentalPreferences>(readStoredPreferences);

  useEffect(() => {
    window.localStorage.setItem(DENTAL_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setSelectedToothId = useCallback((selectedToothId: string) => {
    if (!getToothIdentityById(selectedToothId)) {
      return;
    }

    setPreferences(current => ({
      ...current,
      selectedToothId,
    }));
  }, []);

  const setNumberingSystem = useCallback((numberingSystem: ToothNumberingSystem) => {
    setPreferences(current => ({
      ...current,
      numberingSystem,
    }));
  }, []);

  const setTheme = useCallback((theme: DentalThemePreference) => {
    setPreferences(current => ({
      ...current,
      theme,
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences(current => ({
      ...current,
      theme: current.theme === 'dental' ? 'standard' : 'dental',
    }));
  }, []);

  return {
    preferences,
    setSelectedToothId,
    setNumberingSystem,
    setTheme,
    toggleTheme,
  };
}
