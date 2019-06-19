export const addActiveContext = state => ({
  type: 'ADD_ACTIVE_CONTEXT',
  state,
});

export const removeActiveContext = state => ({
  type: 'REMOVE_ACTIVE_CONTEXT',
  state,
});

export const clearActiveContexts = state => ({
  type: 'CLEAR_ACTIVE_CONTEXTS',
  state,
});

export const setLeftSidebarOpen = state => ({
  type: 'SET_LEFT_SIDEBAR_OPEN',
  state,
});

export const setRightSidebarOpen = state => ({
  type: 'SET_RIGHT_SIDEBAR_OPEN',
  state,
});

const actions = {
  addActiveContext,
  removeActiveContext,
  clearActiveContexts,
  //
  setLeftSidebarOpen,
  setRightSidebarOpen,
};

export default actions;
