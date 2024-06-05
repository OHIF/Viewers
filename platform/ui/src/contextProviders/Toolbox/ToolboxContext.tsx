import React, { createContext, useContext, useReducer } from 'react';

export const initialState = {};

export const toolboxReducer = (state, action) => {
  const { toolbarSectionId } = action.payload;

  if (!state[toolbarSectionId]) {
    state[toolbarSectionId] = { activeTool: null, toolOptions: {}, selectedEvent: false };
  }

  switch (action.type) {
    case 'SET_ACTIVE_TOOL':
      return {
        ...state,
        [toolbarSectionId]: {
          ...state[toolbarSectionId],
          activeTool: action.payload.activeTool,
          selectedEvent: true,
        },
      };
    case 'UPDATE_TOOL_OPTION':
      const { toolName, optionName, value } = action.payload;
      return {
        ...state,
        [toolbarSectionId]: {
          ...state[toolbarSectionId],
          selectedEvent: false,
          toolOptions: {
            ...state[toolbarSectionId].toolOptions,
            [toolName]: state[toolbarSectionId].toolOptions[toolName].map(option =>
              option.id === optionName ? { ...option, value } : option
            ),
          },
        },
      };
    case 'INITIALIZE_TOOL_OPTIONS':
      // Initialize tool options for each toolbarSectionId
      return {
        ...state,
        selectedEvent: false,
        [action.toolbarSectionId]: {
          ...state[action.toolbarSectionId],
          toolOptions: action.payload,
        },
      };
    default:
      return state;
  }
};

const ToolboxContext = createContext();

export const ToolboxProvider = ({ children }) => {
  const [state, dispatch] = useReducer(toolboxReducer, initialState);

  const handleToolSelect = (toolbarSectionId, toolName) => {
    dispatch({
      type: 'SET_ACTIVE_TOOL',
      payload: { toolbarSectionId, activeTool: toolName },
    });
  };

  const handleToolOptionChange = (toolbarSectionId, toolName, optionName, newValue) => {
    dispatch({
      type: 'UPDATE_TOOL_OPTION',
      payload: { toolbarSectionId, toolName, optionName, value: newValue },
    });
  };

  const initializeToolOptions = (toolbarSectionId, toolOptions) => {
    dispatch({
      type: 'INITIALIZE_TOOL_OPTIONS',
      toolbarSectionId,
      payload: toolOptions,
    });
  };

  const api = { handleToolSelect, handleToolOptionChange, initializeToolOptions };

  const value = { state, api };

  return <ToolboxContext.Provider value={value}>{children}</ToolboxContext.Provider>;
};

/**
 * Custom hook for accessing toolbox state and actions for a specific toolbar section.
 * You can use this hook to access the state and actions for a specific toolbar section (
 * defined by the toolbarSectionId) in your custom toolbar components. This hook
 * helps to manage the state and actions for the tools and their options in the toolbar.
 */
export const useToolbox = toolbarSectionId => {
  const context = useContext(ToolboxContext);
  if (context === undefined) {
    throw new Error('useToolbox must be used within a ToolboxProvider');
  }
  const { state, api } = context;

  return {
    state: state[toolbarSectionId] || { activeTool: null, toolOptions: {} },
    api: {
      handleToolSelect: toolName => api.handleToolSelect(toolbarSectionId, toolName),
      handleToolOptionChange: (toolName, optionName, value) =>
        api.handleToolOptionChange(toolbarSectionId, toolName, optionName, value),
      initializeToolOptions: toolOptions =>
        api.initializeToolOptions(toolbarSectionId, toolOptions),
    },
  };
};
