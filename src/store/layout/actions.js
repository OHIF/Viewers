export const setLeftSidebarOpen = state => ({
  type: 'SET_LEFT_SIDEBAR_OPEN',
  state,
});

export const setRightSidebarOpen = state => ({
  type: 'SET_RIGHT_SIDEBAR_OPEN',
  state,
});

const actions = {
  setLeftSidebarOpen,
  setRightSidebarOpen,
};

export default actions;
