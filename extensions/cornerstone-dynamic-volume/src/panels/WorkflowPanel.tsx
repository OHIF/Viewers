import React, { useMemo } from 'react';

const styles = {
  panel: {
    marginBottom: '10px',
    backgroundColor: '#041c4a',
    padding: '10px 0'
  },
  title: {
    marginBottom: '10px',
  },
  container: {
    fontSize: '12px',
    padding: '10px',
  },
  listItem: {
    cursor: 'pointer',
  },
  listItemSelected: {
    cursor: 'pointer',
    color: '#0f0',
  },
}

function WorkflowPanel({ servicesManager, extensionManager }) {
  const StepProgressDropdownWithService = useMemo(() => {
    const defaultComponents = extensionManager.getModuleEntry('@ohif/extension-default.customizationModule.default').value;

    return defaultComponents.find(
      component => component.id === 'stepProgressDropdownWithServiceComponent'
    ).component;
  }, []);

  return (
    <div data-cy={'workflow-panel'} style={styles.panel} >
      <div style={styles.title}>Workflow</div>
      <div style={{ padding: '0 5px 10px' }}>
        <StepProgressDropdownWithService servicesManager={servicesManager} />
      </div>
    </div>
  );
}

export default WorkflowPanel;
