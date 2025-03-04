import React from 'react';
import { ToolboxUI } from '@ohif/ui-next';
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
  const { toolbarButtons, onInteraction } = useToolbar({
    servicesManager,
    buttonSection: buttonSectionId,
  });

  if (!toolbarButtons.length) {
    return null;
  }

  return (
    <ToolboxUI
      {...props}
      title={title}
      toolbarButtons={toolbarButtons}
      onInteraction={onInteraction}
    />
  );
}
