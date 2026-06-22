/**
 * MIMPS-35/36 — Clinical-context store.
 *
 * Holds the EPHEMERAL ClinicalContext fetched by PatientContextPanel so the
 * AIFindingsPanel can populate it onto the InferenceRequest (clinical mode
 * only). Mirrors the lightweight pub-sub pattern of useViewerModeStore — no
 * Zustand/Redux — and deliberately keeps the value IN MEMORY ONLY (never
 * sessionStorage/localStorage): the context is "fetch-use-discard" PHI and must
 * not be persisted in the browser.
 *
 * Lifecycle:
 *   - PatientContextPanel sets it after a consented fetch.
 *   - AIFindingsPanel reads it (clinical mode) to attach `clinical_context`.
 *   - It is cleared on mode change / consent withdrawal / panel unmount.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ClinicalContext } from '../services/inferenceClient';

type Listener = (ctx: ClinicalContext | null) => void;

// In-memory only — intentionally NOT persisted (ephemeral PHI).
let _context: ClinicalContext | null = null;
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach(fn => fn(_context));
}

function _setContext(ctx: ClinicalContext | null): void {
  _context = ctx;
  _notify();
}

/** Read the current ephemeral clinical context synchronously (non-React). */
export function getClinicalContext(): ClinicalContext | null {
  return _context;
}

/** Imperatively set/clear the ephemeral clinical context (non-React). */
export function setClinicalContext(ctx: ClinicalContext | null): void {
  _setContext(ctx);
}

/** Clear the ephemeral clinical context (e.g. on mode change / consent off). */
export function clearClinicalContext(): void {
  _setContext(null);
}

export interface ClinicalContextState {
  context: ClinicalContext | null;
  setContext: (ctx: ClinicalContext | null) => void;
  clearContext: () => void;
}

/**
 * React hook over the ephemeral clinical-context store. All instances stay in
 * sync via the module-level pub-sub.
 */
export function useClinicalContext(): ClinicalContextState {
  const [context, setLocal] = useState<ClinicalContext | null>(_context);

  useEffect(() => {
    const listener: Listener = c => setLocal(c);
    _listeners.add(listener);
    // Sync in case the value changed between render and effect.
    setLocal(_context);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const setContext = useCallback((ctx: ClinicalContext | null) => _setContext(ctx), []);
  const clearContext = useCallback(() => _setContext(null), []);

  return { context, setContext, clearContext };
}
