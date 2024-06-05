import React, { useEffect, useRef } from 'react';
import { useToolbar } from '@ohif/core';
import { ToolboxUI } from './';
import { useToolbox } from '../../contextProviders';

/**
 * A toolbox is a collection of buttons and commands that they invoke, used to provide
 * custom control panels to users. This component is a generic UI component that
 * interacts with services and commands in a generic fashion. While it might
 * seem unconventional to import it from the UI and integrate it into the JSX,
 * it belongs in the UI components as there isn't anything in this component that
 * couldn't be used for a completely different type of app. It plays a crucial
 * role in enhancing the app with a toolbox by providing a way to integrate
 * and display various tools and their corresponding options
 */
function Toolbox({
  servicesManager,
  buttonSectionId,
  commandsManager,
  title,
  ...props
}: withAppTypes) {
  const { state: toolboxState, api } = useToolbox(buttonSectionId);
  const { onInteraction, toolbarButtons } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  const prevButtonIdsRef = useRef('');
  const prevToolboxStateRef = useRef('');

  useEffect(() => {
    const currentButtonIdsStr = JSON.stringify(
      toolbarButtons.map(button => {
        const { id, componentProps } = button;
        if (componentProps.items?.length) {
          return componentProps.items.map(item => `${item.id}-${item.disabled}`);
        }
        return `${id}-${componentProps.disabled}`;
      })
    );

    const currentToolBoxStateStr = JSON.stringify(
      Object.keys(toolboxState.toolOptions).map(tool => {
        const options = toolboxState.toolOptions[tool];
        if (Array.isArray(options)) {
          return options?.map(option => `${option.id}-${option.value}`);
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
              commands: value => {
                api.handleToolOptionChange(parentId, option.id, value);

                const { isArray } = Array;
                const cmds = isArray(option.commands) ? option.commands : [option.commands];

                cmds.forEach(command => {
                  const isString = typeof command === 'string';
                  const isObject = typeof command === 'object';
                  const isFunction = typeof command === 'function';

                  if (isString) {
                    commandsManager.run(command, { value });
                  } else if (isObject) {
                    commandsManager.run({
                      ...command,
                      commandOptions: {
                        ...command.commandOptions,
                        ...option,
                        value,
                        options: updatedOptions,
                      },
                    });
                  } else if (isFunction) {
                    command({ value, commandsManager, servicesManager, options: updatedOptions });
                  }
                });
              },
            };
          });
        };

        const { items, options } = componentProps;

        if (items?.length) {
          items.forEach(({ options, id }) => {
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

  const handleToolOptionChange = (toolName, optionName, newValue) => {
    api.handleToolOptionChange(toolName, optionName, newValue);
  };

  useEffect(() => {
    return () => {
      api.handleToolSelect(null);
    };
  }, []);

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      toolboxState={toolboxState}
      handleToolSelect={id => api.handleToolSelect(id)}
      handleToolOptionChange={handleToolOptionChange}
      onInteraction={onInteraction}
    />
  );
}

export default Toolbox;
