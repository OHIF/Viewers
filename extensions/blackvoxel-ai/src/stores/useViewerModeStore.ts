/**
 * MIMPS-25 — Viewer Mode Store
 *
 * Persists the chosen viewer mode ('research' | 'clinical' | null) in
 * sessionStorage under the key `bv.viewerMode`.
 *
 * Consumed by:
 *   - ViewerModeGate (MIMPS-25): blocks the UI until a mode is selected
 *   - MIMPS-26 (import gate): gates DICOM import to research mode
 *   - MIMPS-27 (model gate): gates AI model selection per mode
 *
 * No third-party state library is required; React state + sessionStorage is
 * sufficient for a single-tab session value.  A module-level singleton
 * (listeners + getters) avoids the overhead of Zustand/Redux at this scope.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewerMode = 'research' | 'clinical';

export interface ViewerModeState {
  /** Currently active mode, or null if not yet chosen. */
  mode: ViewerMode | null;
  /** Set (and persist) the active mode. */
  setMode: (mode: ViewerMode) => void;
  /** Clear the persisted mode so the gate re-prompts on next viewer entry. */
  clearMode: () => void;
}

// ---------------------------------------------------------------------------
// sessionStorage key
// ---------------------------------------------------------------------------

const SESSION_KEY = 'bv.viewerMode';

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------

function readFromSession(): ViewerMode | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === 'research' || raw === 'clinical') {
      return raw;
    }
  } catch {
    // sessionStorage may be blocked in some sandboxed frames — degrade to null.
  }
  return null;
}

function writeToSession(mode: ViewerMode | null): void {
  try {
    if (mode === null) {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, mode);
    }
  } catch {
    // Ignore write failures (private-browsing quota edge-cases).
  }
}

// ---------------------------------------------------------------------------
// Lightweight pub-sub so multiple React hook instances stay in sync without
// pulling in Zustand or another state library.
// ---------------------------------------------------------------------------

type Listener = (mode: ViewerMode | null) => void;

let _mode: ViewerMode | null = readFromSession();
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach(fn => fn(_mode));
}

function _setMode(mode: ViewerMode): void {
  _mode = mode;
  writeToSession(mode);
  _notify();
}

function _clearMode(): void {
  _mode = null;
  writeToSession(null);
  _notify();
}

// ---------------------------------------------------------------------------
// React hook — the primary consumer API
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

/**
 * Returns the current viewer mode and actions to change it.
 *
 * @example
 *   const { mode, setMode, clearMode } = useViewerMode();
 *   if (mode !== 'research') return null;
 */
export function useViewerMode(): ViewerModeState {
  const [mode, setLocalMode] = useState<ViewerMode | null>(_mode);

  useEffect(() => {
    const listener: Listener = m => setLocalMode(m);
    _listeners.add(listener);
    // Sync in case the value changed between render and effect.
    setLocalMode(_mode);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const setMode = useCallback((m: ViewerMode) => _setMode(m), []);
  const clearMode = useCallback(() => _clearMode(), []);

  return { mode, setMode, clearMode };
}

// ---------------------------------------------------------------------------
// Non-hook helpers for consumers that live outside React (e.g. MIMPS-27
// command handlers, service layer, test utilities).
// ---------------------------------------------------------------------------

/** Read the current mode synchronously without subscribing. */
export function getViewerMode(): ViewerMode | null {
  return _mode;
}

/** Imperatively set the mode (useful in non-React code paths). */
export function setViewerMode(mode: ViewerMode): void {
  _setMode(mode);
}

/** Imperatively clear the mode (useful in non-React code paths). */
export function clearViewerMode(): void {
  _clearMode();
}
