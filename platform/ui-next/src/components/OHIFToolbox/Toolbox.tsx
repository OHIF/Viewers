import React, { useEffect, useRef } from 'react';
import { useToolbar } from '@ohif/core';
import { ToolboxUI } from './';
// Migrate this file to the new UI eventually
import { useToolbox } from '@ohif/ui';

function Toolbox({
  servicesManager,
  buttonSectionId,
  commandsManager,
  title,
  ...props
}: withAppTypes) {
  const { toolbarService } = servicesManager.services;
  const { state: toolboxState, api } = useToolbox(buttonSectionId);

  // This will give us the up-to-date "toolbarButtons" with .isActive, .disabled, etc.
  const { onInteraction, toolbarButtons } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  const prevButtonIdsRef = useRef('');
  const prevToolboxStateRef = useRef('');

  // Listen for global tool changes, so we can update the local "activeTool" if we want
  useEffect(() => {
    const subscription = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        const buttons = toolbarService.getButtonSection(buttonSectionId) || [];
        // Find the newly active tool from the global toolbar
        const activeButton = buttons.find(button => button?.isActive === true);
        const activeToolId = activeButton?.id || null;

        // This updates the local "activeTool" in the Toolbox so the correct
        // "toolOptions" appear in the panel (if relevant).
        api.handleToolSelect(activeToolId);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [buttonSectionId, toolbarService, api]);

  // Initialize or refresh tool options in local "toolboxState"
  useEffect(() => {
    const currentButtonIdsStr = JSON.stringify(
      toolbarButtons.map(button => {
        const { id, componentProps } = button;
        if (componentProps?.items?.length) {
          return componentProps.items.map(item => `${item.id}-${item.disabled}`);
        }
        return `${id}-${componentProps.disabled}`;
      })
    );

    const currentToolBoxStateStr = JSON.stringify(
      Object.keys(toolboxState.toolOptions).map(tool => {
        const options = toolboxState.toolOptions[tool];
        if (Array.isArray(options)) {
          return options.map(option => `${option.id}-${option.value}`);
        }
      })
    );

    if (
      prevButtonIdsRef.current === currentButtonIdsStr &&
      prevToolboxStateRef.current === currentToolBoxStateStr
    ) {
      return;
    }

    prevButtonIdsRef.current = currentButtonIdsStr;
    prevToolboxStateRef.current = currentToolBoxStateStr;

    const initializeOptionsWithEnhancements = toolbarButtons.reduce(
      (accumulator, toolbarButton) => {
        const { id: buttonId, componentProps } = toolbarButton;

        const createEnhancedOptions = (options, parentId) => {
          const optionsToUse = Array.isArray(options) ? options : [options];

          return optionsToUse.map(option => {
            if (typeof option.optionComponent === 'function') {
              return option;
            }

            const value =
              toolboxState.toolOptions?.[parentId]?.find(prop => prop.id === option.id)?.value ??
              option.value;

            const updatedOptions = toolboxState.toolOptions?.[parentId];

            return {
              ...option,
              value,
              commands: (val: any) => {
                api.handleToolOptionChange(parentId, option.id, val);

                const { isArray } = Array;
                const cmds = isArray(option.commands) ? option.commands : [option.commands];

                cmds.forEach(command => {
                  const isString = typeof command === 'string';
                  const isObject = typeof command === 'object';
                  const isFunction = typeof command === 'function';

                  if (isString) {
                    commandsManager.run(command, { value: val });
                  } else if (isObject) {
                    commandsManager.run({
                      ...command,
                      commandOptions: {
                        ...command.commandOptions,
                        ...option,
                        value: val,
                        options: updatedOptions,
                      },
                    });
                  } else if (isFunction) {
                    command({
                      value: val,
                      commandsManager,
                      servicesManager,
                      options: updatedOptions,
                    });
                  }
                });
              },
            };
          });
        };

        const { items, options } = componentProps || {};

        if (items?.length) {
          items.forEach(({ options, id }) => {
            if (!options) {
              return;
            }
            accumulator[id] = createEnhancedOptions(options, id);
          });
        } else if (options?.length) {
          accumulator[buttonId] = createEnhancedOptions(options, buttonId);
        } else if (options?.optionComponent) {
          accumulator[buttonId] = options.optionComponent;
        }

        return accumulator;
      },
      {}
    );

    api.initializeToolOptions(initializeOptionsWithEnhancements);
  }, [toolbarButtons, api, toolboxState, commandsManager, servicesManager]);

  // Optionally, clear the activeTool on unmount:
  // If you do NOT want to reset the global tool, remove this effect
  useEffect(() => {
    return () => {
      // NOTE: This sets local activeTool to null, also run global if you prefer
      // api.handleToolSelect(null);
      // commandsManager.runCommand('setToolActiveToolbar', { toolName: null });
    };
  }, []);

  const handleToolOptionChange = (toolName, optionName, newValue) => {
    api.handleToolOptionChange(toolName, optionName, newValue);
  };

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      toolboxState={toolboxState}
      handleToolSelect={id => {
        // *** Instead of only local, also set the global active tool
        if (id) {
          commandsManager.runCommand('setToolActiveToolbar', { toolName: id });
        } else {
          // If user wants to “unset” a tool:
          commandsManager.runCommand('setToolActiveToolbar', { toolName: '' });
        }

        // Keep local state updated for which tool’s advanced config is displayed
        api.handleToolSelect(id);
      }}
      handleToolOptionChange={handleToolOptionChange}
      onInteraction={onInteraction}
    />
  );
}

export default Toolbox;
