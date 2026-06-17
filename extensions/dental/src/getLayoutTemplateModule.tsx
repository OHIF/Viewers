import React from 'react';

import DentalViewerLayout from './layout/DentalViewerLayout';

export default function ({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function DentalViewerLayoutWithServices(props) {
    return (
      <DentalViewerLayout
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        hotkeysManager={hotkeysManager}
        {...props}
      />
    );
  }

  return [
    {
      name: 'dentalViewerLayout',
      id: 'dentalViewerLayout',
      component: DentalViewerLayoutWithServices,
    },
  ];
}
