import React from 'react';

import { useAppConfig } from '@state';
import { Toolbox } from '@ohif/ui';
import PanelSegmentation from './panels/PanelSegmentation';
import { SegmentationPanelMode } from './types/segmentation';

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

    const segPanelConfig = customizationService.get('segmentation.panel') || {};

    const {
      disableEditing,
      segmentationPanelMode = SegmentationPanelMode.Dropdown,
      addSegment = true,
    } = segPanelConfig;

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing || disableEditing,
          segmentationPanelMode: segmentationPanelMode,
          addSegment,
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = configuration => {
    const segPanelConfig = customizationService.get('segmentation.panel') || {};

    const {
      disableEditing,
      segmentationPanelMode = SegmentationPanelMode.Dropdown,
      addSegment = true,
    } = segPanelConfig;

    return (
      <>
        <Toolbox
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
            segmentationPanelMode: segmentationPanelMode,
            disableEditing,
            addSegment,
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
