import React from 'react';
import { WrappedPanelStudyBrowser, WrappedXNATNavigationPanel, WrappedXNATStudyBrowserPanel } from './Panels';
import i18n from 'i18next';
import PanelSegmentation from './Panels/PanelSegmentation';
import SegmentationToolbox from './Panels/SegmentationToolbox';
import { useAppConfig } from '@state';


function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrappedPanelSegmentation = configuration => {
    const [appConfig] = useAppConfig();
    const { customizationService } = servicesManager.services;

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
    const [appConfig] = useAppConfig();
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
          }}
        />
      </>
    );
  };
  return [
    {
      name: 'xnatNavigation',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: props => (
        <WrappedXNATNavigationPanel
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },
    {
      name: 'xnatStudyBrowser',
      iconName: 'tab-studies',
      iconLabel: 'XNAT Studies',
      label: i18n.t('SidePanel:XNAT Studies'),
      component: props => (
        <WrappedXNATStudyBrowserPanel
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },
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
}

export default getPanelModule;
