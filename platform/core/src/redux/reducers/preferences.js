import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  windowLevelData: {
    // order, description, window (int), level (int)
    // 0: { description: 'Soft tissue', window: '', level: '' },
  },
  generalPreferences: {
    // language: 'en-US'
  },
};

const preferences = (state, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES': {
      const newState = action.state || cloneDeep(defaultState);

      return Object.assign({}, state, newState);
    }
    default:
      return cloneDeep(state) || cloneDeep(defaultState);
  }
};

export default preferences;
