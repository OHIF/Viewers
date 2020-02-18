import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef StateType It defines state of hooks.
 * @type {[Object|string]}
 *
 * @callback SetStateCallback Set Hook State method
 * @param {StateType} newState
 *
 * React Hooks to store value at component level and also on browser session storage.
 * By default hooks state will be always in sync with session storage.
 * @param {string} key key property to map value into session storage.
 * @param {StateType} [defaultValue = {}] default value in case there is no related key into session storage
 * @return {[StateType, SetStateCallback]}
 */
const useSessionStorage = (key, defaultValue = {}) => {
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

export default useSessionStorage;
