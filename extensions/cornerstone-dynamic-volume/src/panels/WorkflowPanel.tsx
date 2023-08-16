import React, { useEffect, useMemo } from 'react';

function WorkflowPanel({ servicesManager, extensionManager }) {
  const ProgressDropdownWithService = useMemo(() => {
    const defaultComponents = extensionManager.getModuleEntry(
      '@ohif/extension-default.customizationModule.default'
    ).value;

    return defaultComponents.find(
      component => component.id === 'progressDropdownWithServiceComponent'
    ).component;
  }, [extensionManager]);

  return (
    <div
      data-cy={'workflow-panel'}
      className="px-3 py-4 mb-1 bg-secondary-dark"
    >
      <div className="mb-1">Workflow</div>
      <div>
        <ProgressDropdownWithService servicesManager={servicesManager} />
      </div>
    </div>
  );
}

export default WorkflowPanel;
