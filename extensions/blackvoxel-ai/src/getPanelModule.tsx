import React from 'react';
import AIFindingsPanel from './panels/AIFindingsPanel';
import PatientContextPanel from './panels/PatientContextPanel';
import CondutaSusPanel from './panels/CondutaSusPanel';
import AIPanelErrorBoundary from './panels/AIPanelErrorBoundary';
import { ViewerModeGate } from './components/ViewerModeGate';
import { CONDUTA_SUS_ENABLED } from './config/condutaSus';

/**
 * MIMPS-25: The ViewerModeGate is mounted here alongside the AI panel.
 * It renders a React portal into document.body, so it floats above all OHIF
 * layers regardless of panel DOM position.  The gate is only visible when no
 * valid mode has been chosen (mode === null in sessionStorage).
 */
interface BlackVoxelPanel {
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: () => React.ReactElement;
}

function getPanelModule({ servicesManager }: { servicesManager: unknown }): Array<BlackVoxelPanel> {
  const panels: BlackVoxelPanel[] = [
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

  // SUS-12: Conduta SUS panel. Ships DARK — registered ONLY when the build-time
  // CONDUTA_SUS_ENABLED flag is on, so it does not appear in the panel rail at
  // all by default. Even when registered the panel itself further gates on
  // Clinical mode + a physician-signed read (and degrades to "indisponível"
  // when the platform proxy is disabled).
  if (CONDUTA_SUS_ENABLED) {
    panels.push({
      name: 'blackvoxel-ai-conduta-sus',
      iconName: 'tab-patient-info',
      iconLabel: 'Conduta',
      label: 'Conduta SUS',
      component: () => (
        <AIPanelErrorBoundary>
          <CondutaSusPanel servicesManager={servicesManager} />
        </AIPanelErrorBoundary>
      ),
    });
  }

  return panels;
}

export default getPanelModule;
