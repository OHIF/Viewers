import { useState, useEffect, useCallback } from 'react';

/**
 * A set of session storage keys that should be cleared out of session storage
 * when the page unloads.
 */
const sessionKeysToClearOnUnload: Set<string> = new Set<string>();

const clearOnUnloadCallback = () => {
  Array.from(sessionKeysToClearOnUnload.keys()).forEach(key => {
    window.sessionStorage.removeItem(key);
  });

  // This is here for unit testing since there is no actual unload between tests
  // and the set of keys need to be cleared between tests like it would in
  // a browser between different sessions.
  sessionKeysToClearOnUnload.clear();
};

/**
 * Technically there is no memory leak here because the listener needs to
 * persist until the page unloads and once the page unloads it will be gone.
 *
 * ToDo: unload is not reliably fired on various browsers - particularly mobile.
 * So on some systems the various session storage items will NOT be cleared
 * when the page is refreshed or URL altered in some way. Alternatively,
 * a 'visiblitychange' event could be used whereby on 'hidden' the session item
 * is cleared but maintained in memory in case a 'visible' event is later fired.
 */
window.addEventListener('unload', clearOnUnloadCallback);

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
  const [storeItem, setStoreItem] = useState({ ...storageValue });

  const saveToSessionStorage = useCallback(value => {
    setStoreItem({ ...value });
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }, []);

  useEffect(() => {
    saveToSessionStorage(storeItem);
  }, []);

  if (clearOnUnload) {
    sessionKeysToClearOnUnload.add(key);
  }

  return [storeItem, saveToSessionStorage];
};

export default useSessionStorage;
