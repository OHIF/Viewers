import { BrainMode, lungMode } from "@ohif/viewer/src/utils/constants";

const defaultState = {
  active: lungMode,
};

const mode = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_APPLICATION_MODE': {
      return Object.assign({}, state, { active: action.mode });
    }
    default:
      return state;
  }
};

export default mode;
