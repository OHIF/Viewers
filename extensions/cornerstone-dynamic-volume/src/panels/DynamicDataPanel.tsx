import React, { useEffect, useState, useCallback } from 'react';
import WorkflowPanel from './WorkflowPanel';
import ToolsPanel from './ToolsPanel';
import WindowLevelPanel from './WindowLevelPanel';

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
      <WorkflowPanel servicesManager={servicesManager} />
      <ToolsPanel></ToolsPanel>
      <WindowLevelPanel></WindowLevelPanel>
    </div>
  );
}

export default DynamicDataPanel;
