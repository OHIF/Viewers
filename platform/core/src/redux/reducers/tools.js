const defaultState = {
  active_tool: null,
};

const tool = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_TOOL': {
      return Object.assign({}, state, { active_tool: action.tool });
    }
    default:
      return state;
  }
};

export default tool;
