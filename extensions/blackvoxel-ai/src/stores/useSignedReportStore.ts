/**
 * SUS-12 — Signed-report store.
 *
 * Holds the CURRENT physician-SIGNED read (a SignedReport), if one has been
 * published for the active study. The CondutaSusPanel consumes it: a SUS
 * regulation draft can ONLY be generated from a signed read (hard invariant #1
 * of the conduta_sus contract — an unsigned read NEVER yields a draft).
 *
 * Why a store, not the AI `report_draft`: the inference lane's `report_draft`
 * is an UNSIGNED AI draft that explicitly requires physician review + sign-off
 * before any clinical use (see AIFindingsPanel disclaimer). It is NOT a signed
 * read and MUST NOT be fed to Conduta SUS. The signing flow (physician reviews,
 * edits, and signs the laudo) is the source of a SignedReport; it publishes here
 * once the read is signed. Until then this store is null and the panel shows the
 * "disponível após assinatura do laudo" placeholder.
 *
 * Mirrors the lightweight pub-sub of useViewerModeStore / useClinicalContextStore
 * — no Zustand/Redux. The value is IN MEMORY ONLY (never sessionStorage): a
 * signed read carries PHI (CNS/CPF) and must not be persisted in the browser.
 *
 * Lifecycle: the signing flow sets it after a sign-off; it is cleared on study
 * change / mode change / panel unmount.
 *
 * NOTE (ships dark): until the signing flow is wired to call setSignedReport,
 * this store stays null in every deployment, so the Conduta SUS panel renders
 * its "available after the laudo is signed" placeholder and never drafts.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SignedReport } from '../services/conductaClient';

type Listener = (report: SignedReport | null) => void;

// In-memory only — intentionally NOT persisted (signed read carries PHI).
let _report: SignedReport | null = null;
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach(fn => fn(_report));
}

function _setReport(report: SignedReport | null): void {
  _report = report;
  _notify();
}

/** Read the current signed report synchronously (non-React). */
export function getSignedReport(): SignedReport | null {
  return _report;
}

/**
 * Publish the current physician-signed read (non-React). Called by the signing
 * flow AFTER sign-off. `report.signed` is expected to be true; the panel still
 * defends invariant #1 and the upstream rejects an unsigned read regardless.
 */
export function setSignedReport(report: SignedReport | null): void {
  _setReport(report);
}

/** Clear the signed report (e.g. on study change / mode change / unmount). */
export function clearSignedReport(): void {
  _setReport(null);
}

export interface SignedReportState {
  report: SignedReport | null;
  setReport: (report: SignedReport | null) => void;
  clearReport: () => void;
}

/**
 * React hook over the signed-report store. All instances stay in sync via the
 * module-level pub-sub.
 */
export function useSignedReport(): SignedReportState {
  const [report, setLocal] = useState<SignedReport | null>(_report);

  useEffect(() => {
    const listener: Listener = r => setLocal(r);
    _listeners.add(listener);
    // Sync in case the value changed between render and effect.
    setLocal(_report);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const setReport = useCallback((r: SignedReport | null) => _setReport(r), []);
  const clearReport = useCallback(() => _setReport(null), []);

  return { report, setReport, clearReport };
}
