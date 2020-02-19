import { useState, useEffect, useCallback } from 'react';
/**
 * @typedef StateType It defines state of hooks.
 * @type {[Object|string]}
 *
 * @callback SetStateCallback Set Hook State method
 * @param {StateType} newState
 *
 * React Hooks to store value at component level and also on browser local storage.
 * By default hooks state will be always in sync with local storage.
 * @param {string} key key property to map value into local storage.
 * @param {StateType} [defaultValue = {}] default value in case there is no related key into session storage
 * @return {[StateType, SetStateCallback]}
 */
const useLocalStorage = (key, defaultValue = {}) => {
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

export default useLocalStorage;
