import React from 'react';
import { ToolbarButton } from '@ohif/ui';


const getToolBarModule = ({ commandsManager, extensionManager, servicesManager }) => {
  console.log('getToolBarModule');
  return [
    {
      name: 'DeemeaButton',
      defaultComponent: ToolbarButton,
      clickHandler: () => {
        console.log('deemea-button clicked');
      },
    },
  ];
};

export default getToolBarModule;
