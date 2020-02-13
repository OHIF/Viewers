import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  windowLevelData: {
    1: { description: 'Soft tissue', window: '550', level: '40' },
    2: { description: 'Lung', window: '150', level: '-600' },
    3: { description: 'Liver', window: '150', level: '90' },
    4: { description: 'Bone', window: '2500', level: '480' },
    5: { description: 'Brain', window: '80', level: '40' },
    6: { description: 'Trest', window: '1', level: '1' },
    7: { description: '', window: '', level: '' },
    8: { description: '', window: '', level: '' },
    9: { description: '', window: '', level: '' },
    10: { description: '', window: '', level: '' },
  },
  generalPreferences: {
    // language: 'en-US'
  },
};

const preferences = (state, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES': {
      const newState = cloneDeep(defaultState);
      if (action.state) {
        Object.keys(action.state).forEach(key => {
          if (action.state[key] && typeof action.state[key] === 'object') {
            newState[key] = {
              ...newState[key],
              ...action.state[key],
            };
          }
        });
      }

      return Object.assign({}, state, newState);
    }
    default:
      return cloneDeep(state) || cloneDeep(defaultState);
  }
};

export default preferences;
