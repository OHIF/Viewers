const LocalStorageApi = window.localStorage;
const localStorageKey = 'state';
export const loadState = () => {
  try {
    const serializedState = LocalStorageApi.getItem(localStorageKey);
    if (!serializedState) {
      return undefined;
    }

    return JSON.parse(serializedState);
  } catch (e) {
    return undefined;
  }
};

export const saveState = state => {
  try {
    const serializedState = JSON.stringify(state);
    LocalStorageApi.setItem(localStorageKey, serializedState);
  } catch (e) {}
};

const localStorage = {
  saveState,
  loadState,
};

export default localStorage;
