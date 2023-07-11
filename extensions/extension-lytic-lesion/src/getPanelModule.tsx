import React from 'react';
import {
  WrappedPanelStudyBrowser,
  PanelMeasurementTable,
  PanelPetSUV,
  PanelROIThresholdSegmentation,
  HounsfieldRangeSelector
} from './Panels';

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
        extensionManager={extensionManager}
      />
    );
  };
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
  const wrappedHounsfieldUnitRange = () => {
    return (
      <HounsfieldRangeSelector
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
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
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurements',
      secondaryLabel: 'Measurements',
      component: wrappedMeasurementPanel,
    },
    {
      name: 'petSUV',
      iconName: 'tab-patient-info',
      iconLabel: 'PET SUV',
      label: 'PET SUV',
      component: wrappedPanelPetSuv,
      context: 'LYTIC',
    },
    {
      name: 'ROIThresholdSeg',
      iconName: 'tab-roi-threshold',
      iconLabel: 'ROI Threshold',
      label: 'ROI Threshold',
      component: wrappedROIThresholdSeg,
      context: 'LYTIC',
    },
    {
      name: 'HounsfieldRangeSelector',
      iconName: 'tab-roi-threshold',
      iconLabel: 'Hounsfield Range',
      label: 'Hounsfield Range',
      component: wrappedHounsfieldUnitRange,
      context: 'LYTIC',
    },
  ];
}

export default getPanelModule;
