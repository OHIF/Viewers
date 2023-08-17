import React from 'react';

import { useAppConfig } from '@state';
import PanelSegmentation from './panels/PanelSegmentation';

const getPanelModule = ({
  commandsManager,
  servicesManager,
  extensionManager,
  configuration,
}) => {
  const { customizationService } = servicesManager.services;

  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();

    const disableEditingForMode = customizationService.get(
      'segmentation.disableEditing'
    );

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing:
            appConfig.disableEditing || disableEditingForMode?.value,
        }}
      />
    );
  };

  return [
    {
      name: 'panelSegmentation',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentation,
    },
  ];
};

export default getPanelModule;
