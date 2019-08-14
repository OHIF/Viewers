import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  // Top level key
  viewer: {
    // First tab
    hotKeysData: {
      // hotkeyName, label, keys, column
      // zoom: { label: 'Zoom', command: 'Z', column: 0 },
    },
    // Second tab
    windowLevelData: {
      // order, description, window (int), level (int)
      // 0: { description: 'Soft tissue', window: '', level: '' },
    },
  },
};

const preferences = (state, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES': {
      const newState = action.state ? action.state : cloneDeep(defaultState);

      return Object.assign({}, state, newState);
    }
    default:
      return cloneDeep(state) || cloneDeep(defaultState);
  }
};

export default preferences;
