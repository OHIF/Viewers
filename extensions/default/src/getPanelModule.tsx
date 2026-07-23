import React from 'react';
import { WrappedPanelStudyBrowser } from './Panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
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
    },
  ];
}

export default getPanelModule;
