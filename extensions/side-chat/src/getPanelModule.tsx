import React from 'react';
import { Types } from '@ohif/core';
import SideChatPanel from './components/SideChatPanel';
import PanelSegmentationWithChat from './components/PanelSegmentationWithChat';

function getPanelModule({ servicesManager, commandsManager, extensionManager }): Types.Panel[] {
  return [
    {
      name: 'sideChat',
      iconName: 'ai-chat',
      iconLabel: 'Chat',
      label: 'AI Chat',
      iconColor: 'text-orange-500',
      iconActiveColor: 'text-white',
      iconBgColor: 'bg-orange-900/50',
      iconActiveBgColor: 'bg-orange-500',
      component: props => (
        <SideChatPanel
          {...props}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      ),
    },
    {
      name: 'segmentationWithChat',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation & Chat',
      component: props => (
        <PanelSegmentationWithChat
          {...props}
          extensionManager={extensionManager}
        />
      ),
    },
  ];
}

export default getPanelModule;
