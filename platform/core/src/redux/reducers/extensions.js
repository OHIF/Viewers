export const defaultState = {};

const extensions = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_EXTENSION_DATA':
      const extensionName = action.extension;
      const currentData = state[extensionName] || {};

      const incomingData = action.data;

      const extension = {
        [extensionName]: {
          ...currentData,
          ...incomingData,
        },
      };

      return { ...state, ...extension };

    default:
      return state;
  }
};

export default extensions;
