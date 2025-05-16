import React from 'react';
import { DynamicDataPanel } from './panels';
import { Toolbox } from '@ohif/extension-default';
import { PanelSegmentation } from '@ohif/extension-cornerstone';
import DynamicExport from './panels/DynamicExport';

function getPanelModule({ commandsManager, extensionManager, servicesManager, configuration }) {
  const { toolbarService } = servicesManager.services;

  const wrappedDynamicDataPanel = () => {
    return (
      <DynamicDataPanel
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  const wrappedDynamicSegmentation = () => {
    return (
      <>
        <Toolbox
          buttonSectionId={toolbarService.sections.dynamicToolbox}
          title="Threshold Tools"
        />
        <PanelSegmentation
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          configuration={configuration}
        >
          <DynamicExport
            servicesManager={servicesManager}
            commandsManager={commandsManager}
          />
        </PanelSegmentation>
      </>
    );
  };

  return [
    {
      name: 'dynamic-volume',
      iconName: 'tab-4d',
      iconLabel: '4D Workflow',
      label: '4D Workflow',
      component: wrappedDynamicDataPanel,
    },
    {
      name: 'dynamic-segmentation',
      iconName: 'tab-segmentation',
      iconLabel: 'Segmentation',
      label: 'Segmentation',
      component: wrappedDynamicSegmentation,
    },
  ];
}

export default getPanelModule;
