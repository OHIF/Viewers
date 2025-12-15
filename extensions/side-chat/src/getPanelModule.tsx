import React from 'react';
import { Types } from '@ohif/core';
import SideChatPanel from './components/SideChatPanel';
import PanelSegmentationWithChat from './components/PanelSegmentationWithChat';

function getPanelModule({ servicesManager, commandsManager, extensionManager }): Types.Panel[] {
  return [
    {
      name: 'sideChat',
      iconName: 'tab-patient-info',
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
