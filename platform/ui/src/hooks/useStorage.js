import { useState, useEffect, useCallback } from 'react';

export const useSessionStorage = (key, defaultValue = {}) => {
  const valueFromStorage = window.sessionStorage.getItem(key);
  const storageValue = valueFromStorage
    ? JSON.parse(valueFromStorage)
    : defaultValue;
  const [storeItem, setStoreItem] = useState({ ...storageValue });

  const saveToSessionStorage = useCallback(value => {
    setStoreItem({ ...value });
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }, []);

  useEffect(() => {
    saveToSessionStorage(storeItem);
  }, []);

  return [storeItem, saveToSessionStorage];
};

export const useLocalStorage = (key, defaultValue = {}) => {
  const valueFromStorage = window.localStorage.getItem(key);
  const storageValue = valueFromStorage
    ? JSON.parse(valueFromStorage)
    : defaultValue;
  const [storeItem, setStoreItem] = useState({ ...storageValue });

  const saveToLocalStorage = useCallback(value => {
    setStoreItem({ ...value });
    window.localStorage.setItem(key, JSON.stringify(value));
  }, []);

  useEffect(() => {
    saveToLocalStorage(storeItem);
  }, []);

  return [storeItem, saveToLocalStorage];
};
