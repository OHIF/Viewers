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
function Toolbox({ servicesManager, buttonSectionId, commandsManager, title, ...props }) {
  const { state: toolboxState, api } = useToolbox(buttonSectionId);
  const { onInteraction, toolbarButtons } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  const prevButtonIdsRef = useRef();

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

    if (prevButtonIdsRef.current === currentButtonIdsStr) {
      return;
    }

    prevButtonIdsRef.current = currentButtonIdsStr;

    const initializeOptionsWithEnhancements = toolbarButtons.reduce(
      (accumulator, toolbarButton) => {
        const { id: buttonId, componentProps } = toolbarButton;

        const createEnhancedOptions = (options, parentId) =>
          options.map(option => {
            return {
              ...option,
              value:
                toolboxState.toolOptions?.[parentId]?.find(prop => prop.id === option.id)?.value ??
                option.value,
              onChange: value => {
                api.handleToolOptionChange(parentId, option.id, value);

                if (typeof option.onChange === 'function') {
                  option.onChange(commandsManager, value);
                }
              },
            };
          });

        if (componentProps.items?.length) {
          componentProps.items.forEach(item => {
            accumulator[item.id] = createEnhancedOptions(item.options, item.id);
          });
        } else if (componentProps.options?.length) {
          accumulator[buttonId] = createEnhancedOptions(componentProps.options, buttonId);
        }

        return accumulator;
      },
      {}
    );

    api.initializeToolOptions(initializeOptionsWithEnhancements);
  }, [toolbarButtons, api]);

  const handleToolOptionChange = (toolName, optionName, newValue) => {
    api.handleToolOptionChange(toolName, optionName, newValue);
  };

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      activeToolOptions={toolboxState.toolOptions?.[toolboxState.activeTool]}
      handleToolSelect={id => api.handleToolSelect(id)}
      handleToolOptionChange={handleToolOptionChange}
      onInteraction={onInteraction}
    />
  );
}

export default Toolbox;
