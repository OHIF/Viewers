import React from 'react';
import { WrappedPanelStudyBrowser } from './Panels';

import PanelMeasurementTable from './PanelMeasurementTable.js';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedMeasurementPanel = () => {
    return (
      <PanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
    );
  };

  return [
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: WrappedPanelStudyBrowser.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: wrappedMeasurementPanel,
    },
  ];
}

export default getPanelModule;
