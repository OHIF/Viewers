import React from 'react';
import AIFindingsPanel from './panels/AIFindingsPanel';
import PatientContextPanel from './panels/PatientContextPanel';
import AIPanelErrorBoundary from './panels/AIPanelErrorBoundary';
import { ViewerModeGate } from './components/ViewerModeGate';

/**
 * MIMPS-25: The ViewerModeGate is mounted here alongside the AI panel.
 * It renders a React portal into document.body, so it floats above all OHIF
 * layers regardless of panel DOM position.  The gate is only visible when no
 * valid mode has been chosen (mode === null in sessionStorage).
 */
function getPanelModule({ servicesManager }: { servicesManager: unknown }): Array<{
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: () => React.ReactElement;
}> {
  return [
    {
      name: 'blackvoxel-ai-findings',
      iconName: 'tab-analysis',
      iconLabel: 'AI',
      label: 'Achados IA',
      component: () => (
        <AIPanelErrorBoundary>
          {/* MIMPS-25: mode gate portal — blocks viewer until a mode is chosen */}
          <ViewerModeGate />
          <AIFindingsPanel servicesManager={servicesManager} />
        </AIPanelErrorBoundary>
      ),
    },
    {
      // MIMPS-35: clinical-context panel. Renders inert (placeholder, no fetch)
      // unless CLINICAL_MODE_ENABLED && mode === 'clinical' — ships dark.
      name: 'blackvoxel-ai-patient-context',
      iconName: 'tab-patient-info',
      iconLabel: 'Contexto',
      label: 'Contexto Clínico',
      component: () => (
        <AIPanelErrorBoundary>
          <PatientContextPanel servicesManager={servicesManager} />
        </AIPanelErrorBoundary>
      ),
    },
  ];
}

export default getPanelModule;
