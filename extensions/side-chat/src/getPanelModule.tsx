import React from 'react';
import { Types } from '@ohif/core';
import SideChatPanel from './components/SideChatPanel';

function getPanelModule({ servicesManager, commandsManager }): Types.Panel[] {
  return [
    {
      name: 'sideChat',
      iconName: 'tab-chat', // You'll need to add this icon
      iconLabel: 'Chat',
      label: 'Side Chat',
      component: props => (
        <SideChatPanel
          {...props}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      ),
    },
  ];
}

export default getPanelModule;
