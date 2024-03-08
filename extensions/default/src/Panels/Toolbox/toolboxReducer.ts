export function toolboxReducer(state, action) {
  let newState = { ...state };

  const { payload } = action;
  const { stateSyncService, buttonSectionId } = payload || {};

  switch (action.type) {
    case 'SET_ACTIVE_TOOL':
      newState = {
        ...state,
        activeTool: payload.activeTool,
      };
      break;
    case 'UPDATE_TOOL_OPTION':
      newState = {
        ...state,
        toolOptions: {
          ...state.toolOptions,
          [payload.toolName]: state.toolOptions[payload.toolName].map(option =>
            option.id === payload.optionName ? { ...option, value: payload.value } : option
          ),
        },
      };
      break;
    case 'INITIALIZE_TOOL_OPTIONS':
      // eslint-disable-next-line no-case-declarations
      const newToolOptions = Object.keys(payload?.toolOptions || {}).reduce((acc, toolId) => {
        const tool = payload.toolOptions[toolId];
        if (state.toolOptions[toolId]) {
          // Preserve existing options, potentially merging with new ones if necessary
          acc[toolId] = state.toolOptions[toolId].map(existingOption => {
            const initialOption = tool.find(option => option.id === existingOption.id);
            return initialOption
              ? { ...initialOption, value: existingOption.value }
              : existingOption;
          });
        } else {
          acc[toolId] = tool;
        }
        return acc;
      }, {});

      newState = {
        ...state,
        toolOptions: newToolOptions,
      };
      break;
    default:
      break;
  }

  // store the state in the stateSyncService
  if (payload?.stateSyncService) {
    const prevState = stateSyncService.getState()?.['uiStateStore']?.[buttonSectionId];
    stateSyncService.store({
      uiStateStore: {
        ...stateSyncService.getState()?.['uiStateStore'],
        [buttonSectionId]: {
          ...prevState,
          ...newState,
        },
      },
    });
  }
  return newState;
}
