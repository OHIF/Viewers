import React from 'react';
import WindowLevelPanel from './WindowLevelPanel';
import PanelGenerateImage from './PanelGenerateImage';

function DynamicDataPanel({ servicesManager, commandsManager, extensionManager }) {
  return (
    <div
      className="flex flex-auto flex-col text-white"
      data-cy={'dynamic-volume-panel'}
    >
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

export default DynamicDataPanel;
