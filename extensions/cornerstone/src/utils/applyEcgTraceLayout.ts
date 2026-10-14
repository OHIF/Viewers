import type { TraceLayout } from '../services/ViewportService/Viewport';

type EcgLayoutTarget = {
  setViewState?: (patch: { traceLayout: TraceLayout }) => void;
  setProperties?: (props: { layoutType: string }) => void;
};

/**
 * Applies the trace layout of a hanging protocol to a mounted ECG viewport.
 *
 * A Generic Viewport ECG takes `traceLayout` in its view state. An older ECG
 * viewport without a view state takes a layout name as `layoutType`. An ECG
 * viewport that has no layouts ignores both, and keeps one row for each lead.
 */
export function applyEcgTraceLayout(viewport: unknown, traceLayout?: TraceLayout): void {
  if (traceLayout === undefined || traceLayout === null) {
    return;
  }

  const target = viewport as EcgLayoutTarget;

  if (typeof target.setViewState === 'function') {
    target.setViewState({ traceLayout });
  } else if (typeof traceLayout === 'string' && typeof target.setProperties === 'function') {
    target.setProperties({ layoutType: traceLayout });
  }
}
