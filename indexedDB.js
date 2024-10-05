// db.js
import { openDB } from 'idb';

const dbPromise = openDB('myDatabase', 1, {
  upgrade(db) {
    db.createObjectStore('myStore', { keyPath: 'id' });
  },
});

export const saveData = async (key, data) => {
  const db = await dbPromise;
  await db.put('myStore', { id: key, value: data });
};

export const getData = async key => {
  const db = await dbPromise;
  const result = await db.get('myStore', key);
  return result ? result.value : null;
};
