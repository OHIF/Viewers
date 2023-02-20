import { BrainMode } from "@ohif/viewer/src/utils/constants";

const defaultState = {
  active: BrainMode,
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
