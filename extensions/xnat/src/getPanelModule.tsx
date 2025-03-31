import React from 'react';
import { WrappedPanelStudyBrowser, WrappedXNATNavigationPanel, WrappedXNATStudyBrowserPanel } from './Panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
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
      name: 'xnatNavigation',
      iconName: 'nav-menu',
      iconLabel: 'XNAT Navigation',
      label: i18n.t('SidePanel:XNAT Navigation'),
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
