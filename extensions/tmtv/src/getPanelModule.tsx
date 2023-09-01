import React from 'react';
import { PanelPetSUV, PanelROIThresholdSegmentation } from './Panels';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
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
      iconName: 'tab-patient-info',
      iconLabel: 'PET SUV',
      label: 'PET SUV',
      component: wrappedPanelPetSuv,
    },
    {
      name: 'ROIThresholdSeg',
      iconName: 'tab-roi-threshold',
      iconLabel: 'ROI Threshold',
      label: 'ROI Threshold',
      component: wrappedROIThresholdSeg,
    },
  ];
}

export default getPanelModule;
