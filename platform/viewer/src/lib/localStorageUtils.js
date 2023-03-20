// local-storage-utils.js

export function getItem(key, defaultValue = null) {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : defaultValue;
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key) {
  localStorage.removeItem(key);
}
