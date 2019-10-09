const setLabellingFlowDataAction = labellingFlowData => ({
  type: 'SET_LABELLING_FLOW_DATA',
  labellingFlowData,
});

const resetLabellingAndContextMenuAction = state => ({
  type: 'RESET_LABELLING_AND_CONTEXT_MENU',
  state,
});

const setToolContextMenuDataAction = (viewportIndex, toolContextMenuData) => ({
  type: 'SET_TOOL_CONTEXT_MENU_DATA',
  viewportIndex,
  toolContextMenuData,
});

export {
  resetLabellingAndContextMenuAction,
  setLabellingFlowDataAction,
  setToolContextMenuDataAction,
};
