import React from 'react';

import { useAppConfig } from '@state';
import { Toolbox as NewToolbox } from '@ohif/ui-next';
import { Toolbox as OldToolbox } from '@ohif/ui';
import PanelSegmentation from './panels/PanelSegmentation';

const getPanelModule = ({
  commandsManager,
  servicesManager,
  extensionManager,
  configuration,
  title,
}: withAppTypes) => {
  const { customizationService } = servicesManager.services;

  const wrappedPanelSegmentation = ({ configuration, renderHeader, getCloseIcon, tab }) => {
    const [appConfig] = useAppConfig();

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing,
          ...customizationService.get('segmentation.panel'),
        }}
        renderHeader={renderHeader}
        getCloseIcon={getCloseIcon}
        tab={tab}
      />
    );
  };

  const wrappedPanelSegmentationNoHeader = ({ configuration }) => {
    const [appConfig] = useAppConfig();

    return (
      <PanelSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={{
          ...configuration,
          disableEditing: appConfig.disableEditing,
          ...customizationService.get('segmentation.panel'),
        }}
      />
    );
  };

  const wrappedPanelSegmentationWithTools = ({
    configuration,
    renderHeader,
    getCloseIcon,
    tab,
  }) => {
    const [appConfig] = useAppConfig();

    const Toolbox = appConfig.useExperimentalUI ? NewToolbox : OldToolbox;

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
          renderHeader={renderHeader}
          getCloseIcon={getCloseIcon}
          tab={tab}
        />
        <PanelSegmentation
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          configuration={{
            ...configuration,
            disableEditing: appConfig.disableEditing,
            ...customizationService.get('segmentation.panel'),
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
    {
      name: 'panelSegmentationNoHeader',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedPanelSegmentationNoHeader,
    },
  ];
};

export default getPanelModule;
