import React, { useMemo } from 'react';

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
      className="bg-secondary-dark mb-1 px-3 py-4"
    >
      <div className="mb-1">Workflow</div>
      <div>
        <ProgressDropdownWithService servicesManager={servicesManager} />
      </div>
    </div>
  );
}

export default WorkflowPanel;
