import React, { useMemo } from 'react';

function WindowLevelPanel({ extensionManager, servicesManager }): ReactElement {
  const ActiveViewportWindowLevel = useMemo(
    () =>
      extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.customizationModule.cornerstoneActiveViewportWindowLevelComponent'
      ).value.component,
    [extensionManager]
  );

  return (
    <div data-cy={'windowLevel-panel'}>
      <ActiveViewportWindowLevel servicesManager={servicesManager} />
    </div>
  );
}

export default WindowLevelPanel;
