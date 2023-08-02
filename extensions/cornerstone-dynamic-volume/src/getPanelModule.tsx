import React from 'react';
import { DynamicDataPanel } from './panels';
import { ROISegmentationPanel } from './panels';

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedDynamicDataPanel = () => {
    return (
      <DynamicDataPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  const wrappedROISegmentationPanel = () => {
    return (
      <ROISegmentationPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
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
    {
      name: 'ROISegmentation',
      iconName: 'tab-roi-threshold',
      iconLabel: 'ROI Segmentation',
      label: 'ROI Segmentation',
      component: wrappedROISegmentationPanel,
    },
  ];
}

export default getPanelModule;
