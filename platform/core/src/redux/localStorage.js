export const loadState = () => {
  try {
    const serializedState = window.localStorage.getItem('state');
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
    localStorage.setItem('state', serializedState);
  } catch (e) {}
};

const localStorage = {
  saveState,
  loadState,
};

export default localStorage;
