import React, { useEffect, useRef } from 'react';
import { useToolbar } from '@ohif/core';
import { useToolbox, ToolboxUI } from '@ohif/ui';

function ToolboxContainer({ servicesManager, buttonSectionId, commandsManager, title }) {
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
      title={title}
      toolbarButtons={toolbarButtons}
      activeToolOptions={toolboxState.toolOptions?.[toolboxState.activeTool]}
      handleToolSelect={id => api.handleToolSelect(id)}
      handleToolOptionChange={handleToolOptionChange}
      onInteraction={onInteraction}
    />
  );
}

export default ToolboxContainer;
