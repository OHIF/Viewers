import React from 'react';
import type { Types } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';
import MicroscopyPanel from './components/MicroscopyPanel/MicroscopyPanel';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

export default function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}: Types.Extensions.ExtensionParams) {
  const wrappedMeasurementPanel = ({}) => {
    const [{ activeViewportId, viewports }] = useViewportGrid();

    return (
      <MicroscopyPanel
        viewports={viewports}
        activeViewportId={activeViewportId}
        onSaveComplete={() => {}}
        onRejectComplete={() => {}}
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'measure',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurements',
      secondaryLabel: 'Measurements',
      component: wrappedMeasurementPanel,
    },
  ];
}
