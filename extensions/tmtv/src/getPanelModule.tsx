import React from 'react';
import { PanelPetSUV, PanelROIThresholdSegmentation } from './Panels';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedPanelPetSuv = () => {
    return (
      <PanelPetSUV
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  const wrappedROIThresholdSeg = () => {
    return (
      <PanelROIThresholdSegmentation
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'petSUV',
      iconName: 'circled-checkmark',
      iconLabel: 'PET SUV',
      label: 'PET-SUV',
      component: wrappedPanelPetSuv,
    },
    {
      name: 'ROIThresholdSeg',
      iconName: 'circled-checkmark',
      iconLabel: 'Threshold Seg',
      label: 'Threshold-Seg',
      component: wrappedROIThresholdSeg,
    },
  ];
}

export default getPanelModule;
