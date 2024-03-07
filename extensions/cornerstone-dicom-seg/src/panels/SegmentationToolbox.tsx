import React, { useEffect, useReducer } from 'react';
import { PanelSection, ToolSettings, Tooltip } from '@ohif/ui';
import { useToolbar } from '@ohif/core';
import classnames from 'classnames';

const initialState = {
  activeTool: null, // Tracks the current active tool
  toolOptions: {}, // Stores the options for each tool
};

const BUTTON_SECTION = 'segmentationToolbox';

function toolboxReducer(state, action) {
  let newState = { ...state };

  switch (action.type) {
    case 'SET_ACTIVE_TOOL':
      newState = {
        ...state,
        activeTool: action.payload,
      };
      break;
    case 'UPDATE_TOOL_OPTION':
      newState = {
        ...state,
        toolOptions: {
          ...state.toolOptions,
          [action.payload.toolName]: state.toolOptions[action.payload.toolName].map(option =>
            option.id === action.payload.optionName
              ? { ...option, value: action.payload.value }
              : option
          ),
        },
      };
      break;
    case 'INITIALIZE_TOOL_OPTIONS':
      // eslint-disable-next-line no-case-declarations
      const newToolOptions = action.payload.reduce((acc, tool) => {
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
  if (action.payload?.stateSyncService) {
    const prevState =
      action.payload.stateSyncService.getState()?.['uiStateStore']?.[BUTTON_SECTION];
    action.payload.stateSyncService.store({
      uiStateStore: {
        ...action.payload.stateSyncService.getState()?.['uiStateStore'],
        [BUTTON_SECTION]: {
          ...prevState,
          ...newState,
        },
      },
    });
  }
  return newState;
}

function SegmentationToolbox({ servicesManager, commandsManager }) {
  const { stateSyncService } = servicesManager.services;
  const { onInteraction, toolbarButtons } = useToolbar({
    servicesManager,
    buttonSection: BUTTON_SECTION,
  });

  const [state, dispatch] = useReducer(toolboxReducer, initialState);

  useEffect(() => {
    // Dispatch action to initialize tool options
    const rememberedState = stateSyncService.getState()?.['uiStateStore']?.[BUTTON_SECTION] || {
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
      dispatch({ type: 'SET_ACTIVE_TOOL', payload: rememberedState.activeTool });
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
      payload: updatedToolOptions,
    });
  }, [dispatch, toolbarButtons, commandsManager]);

  if (!toolbarButtons.length) {
    return null;
  }

  // Example function to call when a tool is selected
  const handleToolSelect = toolName => {
    dispatch({ type: 'SET_ACTIVE_TOOL', payload: toolName });
  };

  console.debug(state.activeTool);
  return (
    <PanelSection title={'Segmentation Tools'}>
      <div className="flex flex-col bg-black">
        <div className="bg-primary-dark mt-0.5 flex flex-wrap py-2">
          {toolbarButtons.map(toolDef => {
            if (!toolDef) {
              return null;
            }

            const { id, Component, componentProps } = toolDef;
            const { disabled } = componentProps;

            const tool = (
              <div
                className={classnames('flex flex-col items-center justify-center')}
                onClick={() => handleToolSelect(id)}
              >
                <Component
                  key={id}
                  id={id}
                  onInteraction={onInteraction}
                  servicesManager={servicesManager}
                  {...componentProps}
                />
              </div>
            );

            return disabled ? (
              <Tooltip
                key={id}
                position="bottom"
                content={
                  <>
                    {componentProps.label}
                    <div className="text-xs text-white">
                      Tool not available for current Active viewport
                    </div>
                  </>
                }
              >
                <div className={classnames('ml-2 mb-2')}>{tool}</div>
              </Tooltip>
            ) : (
              <div
                key={id}
                className="ml-2 mb-2"
              >
                {tool}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-primary-dark h-auto px-2">
        {state.activeTool && state.toolOptions[state.activeTool] ? (
          <ToolSettings options={state.toolOptions[state.activeTool]} />
        ) : null}
      </div>
    </PanelSection>
  );
}

export default SegmentationToolbox;
