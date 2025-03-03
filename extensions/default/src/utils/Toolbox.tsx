import React, { useEffect, useRef } from 'react';
import { ToolboxUI, useToolbox } from '@ohif/ui-next';
import { useToolbar } from '@ohif/core';

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
export function Toolbox({
  servicesManager,
  buttonSectionId,
  commandsManager,
  title,
  ...props
}: withAppTypes<{
  buttonSectionId: string;
  title: string;
}>) {
  // We should move these outside of the platform/ui-next, no file here
  // should rely on the managers and services
  const { state: toolboxState, api } = useToolbox(buttonSectionId);
  const toolBartContext = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  let { toolbarButtons } = toolBartContext;

  // const prevButtonIdsRef = useRef('');
  // const prevToolboxStateRef = useRef('');

  // const currentButtonIdsStr = JSON.stringify(
  //   toolbarButtons.map(button => {
  //     const { id, componentProps } = button;
  //     if (componentProps.items?.length) {
  //       return componentProps.items.map(item => `${item.id}-${item.disabled}`);
  //     }
  //     return `${id}-${componentProps.disabled}`;
  //   })
  // );

  // const currentToolBoxStateStr = JSON.stringify(
  //   Object.keys(toolboxState.toolOptions).map(tool => {
  //     const options = toolboxState.toolOptions[tool];
  //     if (Array.isArray(options)) {
  //       return options?.map(option => `${option.id}-${option.value}`);
  //     }
  //   })
  // );

  // if (
  //   prevButtonIdsRef.current === currentButtonIdsStr &&
  //   prevToolboxStateRef.current === currentToolBoxStateStr
  // ) {
  //   return;
  // }

  // prevButtonIdsRef.current = currentButtonIdsStr;
  // prevToolboxStateRef.current = currentToolBoxStateStr;

  if (!toolbarButtons.length) {
    return null;
  }

  toolbarButtons = toolbarButtons.map(toolbarButton => {
    const { id: buttonId, componentProps } = toolbarButton;

    const { items, options } = componentProps;

    let enhancedOptions;
    let onClick;

    if (items?.length) {
      enhancedOptions = {};

      items.forEach(item => {
        const { options, id } = item;
        if (!options) {
          return;
        }

        const { enhancedOptions: optionNew, commandsLater } = createEnhancedOptions({
          options,
          toolName: id,
          toolboxState,
          api,
          commandsManager,
          servicesManager,
        });

        enhancedOptions[id] = optionNew;

        onClick = () => {
          commandsLater.forEach(command => command());
        };
      });
    } else if (options?.length) {
      const { enhancedOptions: optionNew, commandsLater } = createEnhancedOptions({
        options,
        toolName: buttonId,
        toolboxState,
        api,
        commandsManager,
        servicesManager,
      });

      enhancedOptions = optionNew;
      onClick = () => {
        commandsLater.forEach(command => command());
      };
    } else if (options?.optionComponent) {
      // const optionNew = options.optionComponent;
      // enhancedOptions = optionNew;
      // onClick = () => {
      //   commandsLater.forEach(command => command());
      // };
    }

    return {
      ...toolbarButton,
      options: enhancedOptions,
      onClick,
    };
  });

  if (!toolbarButtons.length) {
    return null;
  }

  const handleToolOptionChange = (toolName, optionName, newValue) => {
    api.handleToolOptionChange(toolName, optionName, newValue);
  };

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      handleToolOptionChange={handleToolOptionChange}
      onInteraction={toolBartContext.onInteraction}
    />
  );
}

const createEnhancedOptions = ({
  options,
  toolName,
  toolboxState,
  api,
  commandsManager,
  servicesManager,
}) => {
  const optionsToUse = Array.isArray(options) ? options : [options];

  const commandsLater = [];

  const enhancedOptions = optionsToUse.map(option => {
    if (typeof option.optionComponent === 'function') {
      return option;
    }

    const updatedOptions = toolboxState.toolOptions?.[toolName];
    const value = updatedOptions?.find(prop => prop.id === option.id)?.value ?? option.value;

    const commands = value => {
      const valueToUse = value ?? option.value;
      api.handleToolOptionChange(toolName, option.id, valueToUse);
      const cmds = Array.isArray(option.commands) ? option.commands : [option.commands];

      cmds.forEach(command => {
        const isString = typeof command === 'string';
        const isObject = typeof command === 'object';
        const isFunction = typeof command === 'function';

        if (isString) {
          commandsManager.run(command, { value: valueToUse });
        } else if (isObject) {
          commandsManager.run({
            ...command,
            commandOptions: {
              ...command.commandOptions,
              ...option,
              value: valueToUse,
              options: updatedOptions,
            },
          });
        } else if (isFunction) {
          command({ value: valueToUse, commandsManager, servicesManager, options: updatedOptions });
        }
      });
    };

    commandsLater.push(commands);

    return {
      ...option,
      value,
      commands,
    };
  });

  return { enhancedOptions, commandsLater };
};
