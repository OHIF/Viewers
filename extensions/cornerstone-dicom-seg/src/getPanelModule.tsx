import React from 'react';

import { useAppConfig } from '@state';
import { ToolboxContainer } from '@ohif/extension-default';
import PanelSegmentation from './panels/PanelSegmentation';

const getPanelModule = ({
  commandsManager,
  servicesManager,
  extensionManager,
  configuration,
  title,
}) => {
  const { customizationService } = servicesManager.services;

  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();

    const disableEditingForMode = customizationService.get('segmentation.disableEditing');

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing || disableEditingForMode?.value,
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = configuration => {
    return (
      <>
        <ToolboxContainer
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          buttonSectionId="segmentationToolbox"
          title="Segmentation Tools"
          configuration={{
            ...configuration,
          }}
        />
        <PanelSegmentation
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...configuration,
          }}
        />
      </>
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
    {
      name: 'panelSegmentationWithTools',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationWithTools,
    },
  ];
};

export default getPanelModule;
