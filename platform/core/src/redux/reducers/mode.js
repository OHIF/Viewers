const defaultState = {
  mode: null,
};

const mode = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_APPLICATION_MODE': {
      return Object.assign({}, state, { mode: action.mode });
    }
    default:
      return state;
  }
};

export default mode;
