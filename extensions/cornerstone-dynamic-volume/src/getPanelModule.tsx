import React from 'react';
import { DynamicDataPanel } from './panels';

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  console.warn('>>>>> getPanelModule');
  const wrappedDynamicDataPanel = () => {
    return (
      <DynamicDataPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'dynamic-volume',
      iconName: 'group-layers', // create tab-dynamic-volume icon
      iconLabel: '4D Workflow',
      label: '4D Workflow',
      component: wrappedDynamicDataPanel,
    },
  ];
}

export default getPanelModule;
