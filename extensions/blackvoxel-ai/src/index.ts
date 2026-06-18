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
// MIMPS-26: DICOM import affordance (research-mode-gated)
// ---------------------------------------------------------------------------
export { DicomImportButton } from './components/DicomImportButton';
