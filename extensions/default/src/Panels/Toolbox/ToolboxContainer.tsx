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
      toolOptions: [],
    };

    const toolOptions = toolbarButtons.map(({ id, componentProps }) => ({
      id,
      options: componentProps.options,
    }));

    const toolOptionsToUse =
      rememberedState?.toolOptions && Object.keys(rememberedState.toolOptions).length
        ? Object.keys(rememberedState.toolOptions).map(toolName => ({
            id: toolName,
            options: rememberedState.toolOptions[toolName],
          }))
        : toolOptions;

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

    if (!toolOptionsToUse.length) {
      return;
    }

    const updatedToolOptions = toolOptionsToUse.map(toolOption => {
      const options =
        toolOption.options?.map(option => {
          // Normalize onChange to always be an array for consistent handling
          const onChangeHandlers = Array.isArray(option.onChange)
            ? option.onChange
            : [option.onChange];

          const updatedOnChange = onChangeHandlers.map(onChange => {
            // Function to handle command execution and state update
            const handleCommandAndStateUpdate = value => {
              if (typeof onChange === 'object' && onChange.commandName) {
                commandsManager.runCommand(onChange.commandName, { value }, onChange.context);
              }

              // Regardless of whether it's a custom function or a command, update the state
              dispatch({
                type: 'UPDATE_TOOL_OPTION',
                payload: {
                  toolName: toolOption.id,
                  optionName: option.id,
                  value: value,
                  stateSyncService,
                  buttonSectionId,
                },
              });
            };

            // If the original onChange is a function, wrap it to also update the state
            if (typeof onChange === 'function') {
              return value => {
                onChange(value); // Call the original function
                handleCommandAndStateUpdate(value); // Then handle state update
              };
            } else {
              // If onChange is not a function, directly return the handler
              return handleCommandAndStateUpdate;
            }
          });

          return { ...option, onChange: updatedOnChange };
        }) || [];

      return { ...toolOption, options };
    });

    dispatch({
      type: 'INITIALIZE_TOOL_OPTIONS',
      payload: {
        toolOptions: updatedToolOptions,
        stateSyncService,
        buttonSectionId,
      },
    });
  }, [dispatch, toolbarButtons, commandsManager]);

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
