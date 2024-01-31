import React from 'react';
import WorkflowPanel from './WorkflowPanel';
import WindowLevelPanel from './WindowLevelPanel';
import PanelGenerateImage from './PanelGenerateImage';

function DynamicDataPanelWithWorkflow({ servicesManager, commandsManager, extensionManager }) {
  return (
    <div
      className="flex flex-auto flex-col text-white"
      data-cy={'dynamic-volume-panel'}
    >
      <WorkflowPanel
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
      <PanelGenerateImage
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      ></PanelGenerateImage>
      <WindowLevelPanel
        extensionManager={extensionManager}
        servicesManager={servicesManager}
      ></WindowLevelPanel>
    </div>
  );
}

export default DynamicDataPanelWithWorkflow;
