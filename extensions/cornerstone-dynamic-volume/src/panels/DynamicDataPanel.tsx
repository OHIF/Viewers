import React, { useEffect, useState, useCallback } from 'react';
import WorkflowPanel from './WorkflowPanel';
import ToolsPanel from './ToolsPanel';
import WindowLevelPanel from './WindowLevelPanel';
import PanelGenerateImage from './PanelGenerateImage';

function DynamicDataPanel({
  servicesManager,
  commandsManager,
  extensionManager,
}) {
  return (
    <div
      className="flex flex-col flex-auto text-white"
      data-cy={'dynamic-volume-panel'}
    >
      <WorkflowPanel
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
      {/* <ToolsPanel></ToolsPanel>
      <WindowLevelPanel></WindowLevelPanel> */}
      <PanelGenerateImage
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      ></PanelGenerateImage>
    </div>
  );
}

export default DynamicDataPanel;
