import React from 'react';
import PanelGenerateImage from './PanelGenerateImage';

function DynamicDataPanel({ servicesManager, commandsManager }) {
  return (
    <div
      className="flex flex-col text-white"
      data-cy={'dynamic-volume-panel'}
    >
      <PanelGenerateImage
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      ></PanelGenerateImage>
    </div>
  );
}

export default DynamicDataPanel;
