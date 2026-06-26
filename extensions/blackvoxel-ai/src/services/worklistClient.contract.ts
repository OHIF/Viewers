/**
 * worklistClient.contract.ts (MIMPS-42)
 *
 * COMPILE-TIME field-alignment assertion for the persisted-vs-live findings
 * contract. This file is type-checked by `tsc --noEmit` (the same check that
 * gates this slice) but has no runtime effect — it exports nothing executable.
 * If the persisted `AIResult.findings` shape ever drifts from the live
 * `InferenceFinding` shape the viewer already renders, THIS FILE FAILS TO
 * COMPILE — surfacing the drift loudly instead of letting a forked renderer
 * silently paper over it.
 *
 * The asserted contract (verified against the live platform source):
 *   1_platform/backend/services/proxy_inference.py builds each finding dict as
 *     { label, label_en, confidence, bounding_box, severity, band, region?,
 *       laterality?, zone? }
 *   and persists that verbatim into AIResult.findings (models.py:392), exposed
 *   untyped (`list`) by WorklistAIResult.findings (schemas.py). That dict is
 *   field-identical to this viewer's `InferenceFinding`, so persisted findings
 *   render through the SAME AIFindingsPanel with no per-field remap.
 *
 * NOTE (documented drift to report, not patch): the §6 doc / task brief describe
 * the persisted finding as `{ label, label_en, band, score, region? }` with a
 * `score` field. The ACTUAL backend persists `confidence` (not `score`) and the
 * full proxy dict. The viewer aligns to the live `InferenceFinding` (`confidence`)
 * — which is what the backend emits — so rendering is correct. The doc wording
 * (`score`) is the drift; it should be corrected to `confidence` in the §6 spec.
 * Reported, not worked around.
 */

import type { InferenceFinding } from './inferenceClient';
import type { WorklistAIResult } from './worklistClient';

/** Compile-time assert: `Actual` is assignable to `Expected`. */
type AssertAssignable<Expected, Actual extends Expected> = Actual;

// (1) A representative persisted finding (exactly the proxy_inference dict, incl.
// a Grad-CAM region) MUST satisfy the live InferenceFinding shape. If a field is
// renamed/removed on either side, this object literal stops being assignable and
// tsc errors.
const PERSISTED_FINDING_FIXTURE = {
  label: 'Cardiomegalia',
  label_en: 'Cardiomegaly',
  confidence: 0.91,
  bounding_box: null,
  severity: 'moderate',
  band: 'provável',
  region: { x: 0.3, y: 0.4, width: 0.2, height: 0.25, method: 'gradcam-cc-v1' },
  laterality: null,
  zone: 'mid',
} satisfies InferenceFinding;

// (2) The persisted findings list type IS the live finding list type — one
// renderer, two sources. This line errors if WorklistAIResult.findings ever
// stops being InferenceFinding[].
type _PersistedFindingsAreLiveFindings = AssertAssignable<
  InferenceFinding[],
  WorklistAIResult['findings']
>;

// Reference the bindings so `noUnusedLocals`/lint do not flag them; this file is
// purely a type gate.
export const __WORKLIST_CONTRACT_OK__ = PERSISTED_FINDING_FIXTURE.label_en === 'Cardiomegaly';
export type __PersistedFindingsAreLiveFindings = _PersistedFindingsAreLiveFindings;
