import cloneDeep from 'lodash.clonedeep';
import i18n from '@ohif/i18n';

const defaultState = {
  // First tab
  hotkeyDefinitions: [
    // commandName, label, keys
    // [{ zoom: { label: 'Zoom', keys: ['z'] }}]
  ],
  // Second tab
  windowLevelData: {
    // order, description, window (int), level (int)
    // 0: { description: 'Soft tissue', window: '', level: '' },
  },
  generalPreferences: {
    language: i18n.language.split('-')[0],
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
