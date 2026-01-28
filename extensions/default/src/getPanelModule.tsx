import React from 'react';
import { WrappedPanelStudyBrowser, PanelMedBook } from './Panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  console.log('[getPanelModule] @ohif/extension-default getPanelModule called');

  const wrappedPanelMedBook = ({ configuration }) => {
    console.log('[getPanelModule] Rendering PanelMedBook');
    return (
      <PanelMedBook
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        configuration={configuration}
      />
    );
  };

  const panels = [
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
    {
      name: 'panelMedBook',
      iconName: 'tab-call-patient',
      iconLabel: 'Call patient',
      label: 'Call patient',
      iconColor: 'text-[#4DC0C0]',
      iconActiveColor: 'text-white',
      iconBgColor: 'bg-[#4DC0C0]/20',
      iconActiveBgColor: 'bg-[#4DC0C0]',
      component: wrappedPanelMedBook,
    },
  ];

  console.log('[getPanelModule] Returning panels:', panels.map(p => p.name));
  return panels;
}

export default getPanelModule;
