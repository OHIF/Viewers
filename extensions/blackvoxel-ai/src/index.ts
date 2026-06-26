import { id } from './id';
import getPanelModule from './getPanelModule';
import { registerBlackVoxelAILocales } from './i18n';

// I18N-04: register the 'blackvoxel-ai' i18next namespace (en + pt-BR) on the
// shared @ohif/i18n singleton at extension load, so t('blackvoxel-ai:…')
// resolves the moment any panel/component renders.
registerBlackVoxelAILocales();

export default {
  id,
  getPanelModule,
};

export { id };

// I18N-04: compact PT/EN toggle reachable inside the viewer (rendered from the
// AI panel header).
export { LanguageToggle } from './components/LanguageToggle';

// ---------------------------------------------------------------------------
// MIMPS-25: Viewer mode store — exported so MIMPS-26 (import gate) and
// MIMPS-27 (model gating) can import without reaching into internal paths.
// ---------------------------------------------------------------------------
export {
  useViewerMode,
  getViewerMode,
  setViewerMode,
  clearViewerMode,
} from './stores/useViewerModeStore';
export type { ViewerMode, ViewerModeState } from './stores/useViewerModeStore';

// Re-export the change-mode button so the viewer header (or any future
// toolbar integration) can render it without importing internal paths.
export { ChangeModeButton } from './components/ViewerModeGate';

// ---------------------------------------------------------------------------
// MIMPS-33/35/36: clinical-context feature (ships dark, CLINICAL_MODE_ENABLED).
// ---------------------------------------------------------------------------
export { CLINICAL_MODE_ENABLED } from './config/clinicalMode';
export { default as PatientContextPanel } from './panels/PatientContextPanel';
export { getPatientContext } from './services/labsClient';
export {
  useClinicalContext,
  getClinicalContext,
  setClinicalContext,
  clearClinicalContext,
} from './stores/useClinicalContextStore';
export type { ClinicalContextState } from './stores/useClinicalContextStore';
export type {
  ClinicalContext,
  LabResult,
  ConsentRecord,
  Provenance,
} from './services/inferenceClient';

// ---------------------------------------------------------------------------
// SUS-12: Conduta SUS panel (ships dark, CONDUTA_SUS_ENABLED). The panel calls
// the platform proxy POST /api/v1/conduta/{draft,submit} (SUS-11) and gates on
// Clinical mode + a physician-signed read. claims:none.
// ---------------------------------------------------------------------------
export { CONDUTA_SUS_ENABLED } from './config/condutaSus';
export { default as CondutaSusPanel } from './panels/CondutaSusPanel';
export { condutaDraft, condutaSubmit, CondutaError, CondutaDisabledError } from './services/conductaClient';
export {
  useSignedReport,
  getSignedReport,
  setSignedReport,
  clearSignedReport,
} from './stores/useSignedReportStore';
export type { SignedReportState } from './stores/useSignedReportStore';
export type {
  CondutaRequest,
  SignedReport,
  CondutaFinding,
  CondutaPatient,
  CondutaPractitioner,
  CondutaEstablishment,
  CondutaPathway,
  CondutaPriority,
  CondutaPriorityName,
  CondutaColor,
  CondutaDraftResult,
  CondutaDraftSuccess,
  CondutaSubmitResult,
  CondutaSubmitSuccess,
  CondutaErrorResult,
  CondutaErrorCode,
} from './services/conductaClient';
