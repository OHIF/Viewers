const defaultState = {
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  labelling: {},
  contextMenu: {},
};

const ui = (state = defaultState, action) => {
  switch (action.type) {
    // ~ SIDEBAR
    case 'SET_LEFT_SIDEBAR_OPEN':
      return Object.assign({}, state, { leftSidebarOpen: action.state });
    case 'SET_RIGHT_SIDEBAR_OPEN':
      return Object.assign({}, state, { rightSidebarOpen: action.state });
    case 'SET_LABELLING_FLOW_DATA': {
      const labelling = Object.assign({}, action.labellingFlowData);

      return Object.assign({}, state, { labelling });
    }
    case 'SET_TOOL_CONTEXT_MENU_DATA': {
      const contextMenu = Object.assign({}, state.contextMenu);

      contextMenu[action.viewportIndex] = Object.assign(
        {},
        action.toolContextMenuData
      );

      return Object.assign({}, state, { contextMenu });
    }
    case 'RESET_LABELLING_AND_CONTEXT_MENU':
      return Object.assign({}, state, {
        labelling: defaultState.labelling,
        contextMenu: defaultState.contextMenu,
      });
    default:
      return state;
  }
};

export default ui;
