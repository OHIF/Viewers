import { useState, useEffect, useCallback } from 'react';

/**
 * A map of session storage items that should be cleared out of session storage
 * when the page unloads.
 */
const sessionItemsToClearOnUnload: Map<string, string> = new Map<string, string>();

/**
 * This callback simulates clearing the various session items when a page unloads.
 * When the page is hidden the session storage items are removed but maintained
 * in the map above in case the page becomes visible again. So those pages that
 * are hidden because they are being unloaded have their session storage disposed
 * of for ever. For those pages that are hidden, but later return to visible,
 * this callback restores the session storage from the map above.
 */
const visibilityChangeCallback = () => {
  if (document.visibilityState === 'hidden') {
    Array.from(sessionItemsToClearOnUnload.keys()).forEach(key => {
      window.sessionStorage.removeItem(key);
    });
  } else {
    Array.from(sessionItemsToClearOnUnload.keys()).forEach(key => {
      window.sessionStorage.setItem(key, sessionItemsToClearOnUnload.get(key));
    });
  }
};

/**
 * Technically there is no memory leak here because the listener needs to
 * persist until the page unloads and once the page unloads it will be gone.
 */
document.addEventListener('visibilitychange', visibilityChangeCallback);

type useSessionStorageProps = {
  key: string;
  defaultValue: unknown;
  clearOnUnload: boolean;
};

const useSessionStorage = ({
  key,
  defaultValue = {},
  clearOnUnload = false,
}: useSessionStorageProps) => {
  const valueFromStorage = window.sessionStorage.getItem(key);
  const storageValue = valueFromStorage ? JSON.parse(valueFromStorage) : defaultValue;
  const [sessionItem, setSessionItem] = useState({ ...storageValue });

  const updateSessionItem = useCallback(value => {
    setSessionItem({ ...value });

    const valueAsStr = JSON.stringify(value);

    if (!clearOnUnload || document.visibilityState === 'visible') {
      window.sessionStorage.setItem(key, valueAsStr);
    }

    if (clearOnUnload) {
      sessionItemsToClearOnUnload.set(key, valueAsStr);
    }
  }, []);

  useEffect(() => {
    updateSessionItem(sessionItem);
  }, []);

  return [sessionItem, updateSessionItem];
};

export default useSessionStorage;
