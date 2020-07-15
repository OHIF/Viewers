const SessionStorageApi = window.sessionStorage;
const sessionStorageKey = 'state';
export const loadState = () => {
  try {
    const serializedState = SessionStorageApi.getItem(sessionStorageKey);
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
    SessionStorageApi.setItem(sessionStorageKey, serializedState);
  } catch (e) {}
};

const sessionStorage = {
  saveState,
  loadState,
};

export default sessionStorage;
