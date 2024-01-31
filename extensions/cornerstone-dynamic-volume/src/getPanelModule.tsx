import React from 'react';
import { DynamicDataPanel, DynamicDataPanelWithWorkflow } from './panels';
import { ROISegmentationPanel } from './panels';

function getPanelModule({ commandsManager, extensionManager, servicesManager }) {
  const DynamicDataPanelWithWorkflowPanel = () => {
    return (
      <DynamicDataPanelWithWorkflow
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

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
      name: 'dynamic-volume-with-workflow',
      iconName: 'group-layers', // create tab-dynamic-volume icon
      iconLabel: '4D Workflow',
      label: '4D Workflow',
      component: DynamicDataPanelWithWorkflowPanel,
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
