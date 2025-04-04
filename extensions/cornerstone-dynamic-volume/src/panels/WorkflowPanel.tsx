import React from 'react';
import type { ServicesManager } from '@ohif/core';

function WorkflowPanel({ servicesManager }: { servicesManager: ServicesManager }) {
  const ProgressDropdownWithService =
    servicesManager.services.customizationService.getCustomization(
      'progressDropdownWithServiceComponent'
    );

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
