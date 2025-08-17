import React from 'react';
import { AutometricsPanel } from './Panels';

function getPanelModule({ commandsManager, servicesManager, extensionManager }) {
  const wrappedAutometricsPanel = () => {
    return (
      <AutometricsPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
    );
  };

  return [
    {
      name: 'autometrics',
      iconName: 'tab-autometrics',
      iconLabel: 'Autometrics',
      label: 'Autometrics',
      component: wrappedAutometricsPanel,
    },
  ];
}

export default getPanelModule;
