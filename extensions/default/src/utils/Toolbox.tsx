import React from 'react';
import { ToolboxUI } from '@ohif/ui-next';
import { useSystem, useToolbar } from '@ohif/core';

interface ButtonProps {
  isActive?: boolean;
  options?: unknown;
}

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
  buttonSectionId,
  title,
  ...props
}: {
  buttonSectionId: string;
  title: string;
}) {
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  const { toolbarButtons: originalToolbarButtons, onInteraction } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  const findActiveToolOptions = buttons => {
    for (const tool of buttons) {
      if (tool.componentProps.isActive) {
        return tool.componentProps.options;
      }

      if (tool.componentProps.buttonSection) {
        const buttonProps = toolbarService.getButtonPropsInButtonSection(
          tool.componentProps.buttonSection
        ) as ButtonProps[];

        const activeTool = buttonProps.find(item => item.isActive);
        if (!activeTool) {
          continue;
        }

        return activeTool?.options;
      }
    }

    return null;
  };

  // Prepare the toolbar buttons with service-related props
  const toolbarButtons = originalToolbarButtons.map(button => ({
    ...button,
    Component: props => {
      const ButtonComponent = button.Component;
      return (
        <ButtonComponent
          {...props}
          servicesManager={servicesManager}
        />
      );
    },
  }));

  const activeToolOptions = findActiveToolOptions(toolbarButtons);

  if (!toolbarButtons.length) {
    return null;
  }

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      onInteraction={onInteraction}
      numRows={Math.ceil(toolbarButtons.length / 4)}
      activeToolOptions={activeToolOptions}
    />
  );
}
