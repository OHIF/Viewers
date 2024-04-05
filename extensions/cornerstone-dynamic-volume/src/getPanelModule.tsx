import React from 'react';
import { DynamicDataPanel } from './panels';
import { Toolbox } from '@ohif/ui';

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const wrappedDynamicDataPanel = () => {
    return (
      <DynamicDataPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  const wrappedDynamicToolbox = () => {
    return (
      <>
        <Toolbox
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          buttonSectionId="dynamic-toolbox"
          title="Threshold Tools"
        />
      </>
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
    {
      name: 'dynamic-toolbox',
      iconName: 'group-layers',
      iconLabel: '4D Workflow',
      label: 'Dynamic Toolbox',
      component: wrappedDynamicToolbox,
    },
    {
      name: 'dynamic-export',
      iconName: 'group-layers', // create tab-dynamic-volume icon
      iconLabel: '4D Workflow',
      label: '4D Workflow',
      component: () => {
        return <div className="text-white">export </div>;
      },
    },
  ];
}

export default getPanelModule;
