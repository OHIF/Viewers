import { useCallback, useState } from 'react';

export function useSyncedStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const savedPreferences = localStorage.getItem(key);
      if (!savedPreferences) return defaultValue;
      return JSON.parse(savedPreferences);
    } catch (e) {
      return defaultValue;
    }
  });

  const updateState = useCallback(
    state => {
      setState(state);
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        toast.error(
          'Your preferences cannot be saved because of some missing permissions.'
        );
      }
    },
    [key]
  );

  return [state, updateState];
}
