import React from 'react';
import { WrappedPanelStudyBrowser, PanelMeasurementTable } from './Panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrappedMeasurementPanel = ({ getOpenStateComponent }) => {
    return (
      <PanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        getOpenStateComponent={getOpenStateComponent}
      />
    );
  };

  return [
    {
      name: 'seriesList',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: props => (
        <WrappedPanelStudyBrowser
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
      viewPresets: [
        {
          id: 'list',
          iconName: 'icon-list-view',
        },
        {
          id: 'thumbnails',
          iconName: 'icon-thumbnail-view',
        },
      ],
      viewPreset: 'thumbnails',
      actionIcons: [
        {
          id: 'settings',
          iconName: 'settings-bars',
          value: false,
        },
      ],
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
