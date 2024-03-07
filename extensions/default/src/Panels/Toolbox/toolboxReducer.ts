export function toolboxReducer(state, action) {
  let newState = { ...state };

  const { payload } = action;
  const { stateSyncService, toolboxId } = payload || {};

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
      const newToolOptions = payload.toolOptions.reduce((acc, tool) => {
        if (state.toolOptions[tool.id]) {
          // Preserve existing options, potentially merging with new ones if necessary
          acc[tool.id] = state.toolOptions[tool.id].map(existingOption => {
            const initialOption = tool.options.find(option => option.id === existingOption.id);
            return initialOption
              ? { ...initialOption, value: existingOption.value }
              : existingOption;
          });
        } else {
          acc[tool.id] = tool.options;
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
    const prevState = stateSyncService.getState()?.['uiStateStore']?.[toolboxId];
    stateSyncService.store({
      uiStateStore: {
        ...stateSyncService.getState()?.['uiStateStore'],
        [toolboxId]: {
          ...prevState,
          ...newState,
        },
      },
    });
  }
  return newState;
}
