import { id } from './id';
import getPanelModule from './getPanelModule';

export default {
  id,
  getPanelModule,
};

export { id };

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
