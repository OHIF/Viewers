import React, { useEffect, useReducer } from 'react';
import { useToolbar } from '@ohif/core';
import { toolboxReducer } from './toolboxReducer';
import { ToolboxUI } from './ToolboxUI';

const initialState = {
  activeTool: null, // Tracks the current active tool
  toolOptions: {}, // Stores the options for each tool
};

// Todo: make this configurable
const itemsPerRow = 4;

function ToolboxContainer({ servicesManager, commandsManager, buttonSectionId, title }) {
  const { stateSyncService } = servicesManager.services;
  const { onInteraction, toolbarButtons } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  const [state, dispatch] = useReducer(toolboxReducer, initialState);

  useEffect(() => {
    // Dispatch action to initialize tool options
    const rememberedState = stateSyncService.getState()?.['uiStateStore']?.[buttonSectionId] || {
      activeTool: null,
      toolOptions: {},
    };

    const initializeOptionsWithFunctions = toolbarButtons.reduce(
      (acc, { id, componentProps: props }) => {
        const options = props.options?.map(option => ({
          ...option,
          // Replace the onChange property with a new function that calls the original execute function
          onChange: value => {
            // Call the execute function with commandsManager and the value
            // This assumes that the execute function is directly assigned in the configuration
            if (typeof option.onChange === 'function') {
              option.onChange(commandsManager, value);
            }

            // Update the tool option state after executing the command
            dispatch({
              type: 'UPDATE_TOOL_OPTION',
              payload: {
                toolName: id,
                optionName: option.id,
                value: value,
                stateSyncService,
                buttonSectionId,
              },
            });
          },
        }));
        return { ...acc, [id]: options };
      },
      {}
    );

    const updatedToolOptions =
      rememberedState?.toolOptions && Object.keys(rememberedState.toolOptions)?.length
        ? rememberedState.toolOptions
        : initializeOptionsWithFunctions;

    if (rememberedState.activeTool) {
      dispatch({
        type: 'SET_ACTIVE_TOOL',
        payload: {
          activeTool: rememberedState.activeTool,
          stateSyncService,
          buttonSectionId,
        },
      });
    }

    dispatch({
      type: 'INITIALIZE_TOOL_OPTIONS',
      payload: {
        toolOptions: updatedToolOptions,
        stateSyncService,
        buttonSectionId,
      },
    });
  }, [dispatch, toolbarButtons, commandsManager, stateSyncService, buttonSectionId]);

  if (!toolbarButtons.length) {
    return null;
  }

  // Example function to call when a tool is selected
  const handleToolSelect = toolName => {
    dispatch({
      type: 'SET_ACTIVE_TOOL',
      payload: {
        activeTool: toolName,
        stateSyncService,
        buttonSectionId,
      },
    });
  };

  const numItems = toolbarButtons.length;
  const numRows = Math.ceil(numItems / itemsPerRow);

  return (
    <ToolboxUI
      toolbarButtons={toolbarButtons}
      activeTool={state.activeTool}
      toolOptions={state.toolOptions}
      numRows={numRows}
      servicesManager={servicesManager}
      title={title}
      handleToolSelect={handleToolSelect}
      onInteraction={onInteraction}
    />
  );
}

export default ToolboxContainer;
