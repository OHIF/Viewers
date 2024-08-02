import React from 'react';
import { WrappedPanelStudyBrowser, PanelMeasurementTable } from './Panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrappedMeasurementPanel = () => {
    return (
      <PanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'seriesList',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: WrappedPanelStudyBrowser.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
      viewPresets: [{
        id: 'thumbnails',
        iconName: 'icon-thumbnail-view',
      }, {
        id: 'list',
        iconName: 'icon-list-view',
      }],
      viewPreset: 'thumbnails',
      actionIcons: [{
        id: 'settings',
        iconName: 'settings-bar',
        value: false
      }]
    },
    {
      name: 'measurements',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      secondaryLabel: i18n.t('SidePanel:Measurements'),
      component: wrappedMeasurementPanel,
    },
  ];
}

export default getPanelModule;
