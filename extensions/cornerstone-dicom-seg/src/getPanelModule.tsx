import React from 'react';

import { useAppConfig } from '@state';
import PanelSegmentation from './panels/PanelSegmentation';
import SegmentationToolbox from './panels/SegmentationToolbox';
import { SegmentationPanelMode } from './types/segmentation';

const getPanelModule = ({ commandsManager, servicesManager, extensionManager, configuration }) => {
  const { customizationService } = servicesManager.services;

  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();

    const disableEditingForMode = customizationService.get('segmentation.disableEditing');
    const segmentationPanelMode =
      customizationService.get('segmentation.segmentationPanelMode')?.value ||
      SegmentationPanelMode.Dropdown;

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing || disableEditingForMode?.value,
          segmentationPanelMode: segmentationPanelMode,
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = configuration => {
    const [appConfig] = useAppConfig();
    const segmentationPanelMode =
      customizationService.get('segmentation.segmentationPanelMode')?.value ||
      SegmentationPanelMode.Dropdown;

    return (
      <>
        <SegmentationToolbox
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
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
            segmentationPanelMode: segmentationPanelMode,
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
