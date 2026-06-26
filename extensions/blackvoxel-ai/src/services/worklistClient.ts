/**
 * worklistClient.ts (MIMPS-42)
 *
 * Fetch-based client for the platform worklist detail endpoint
 * `GET /api/v1/worklist/{study_uid}`, which returns a WorklistItem plus the
 * LATEST persisted AIResult for the study (`ai_result`, null for transport-only
 * studies). Lets a previously-inferred X-ray study show its findings WITHOUT
 * re-running live inference.
 *
 * Mirrors `inferenceClient.ts` exactly: no axios, the same `blackvoxel_jwt`
 * sessionStorage token, an 8s AbortController timeout, and the INT-05
 * 401 → SSO handoff. Ships DARK behind the MIMPS-40 `blackvoxelWorklist.enabled`
 * gate — the caller never invokes this unless the gate is on.
 *
 * FIELD ALIGNMENT (the load-bearing contract for MIMPS-42):
 *   The persisted `ai_result.findings` blob is the platform's per-finding dict
 *   `{ label, label_en, confidence, bounding_box, severity, band, region?,
 *   laterality?, zone? }` — written verbatim by `proxy_inference` at ingest
 *   (1_platform/backend/services/proxy_inference.py) and passed through untyped
 *   by `WorklistAIResult.findings` (1_platform/backend/schemas.py). That is the
 *   SAME shape as the live `InferenceFinding` this viewer already renders, so
 *   persisted and live findings flow through ONE renderer (AIFindingsPanel) with
 *   NO forked component and NO per-field remap. `toInferenceResponse` below only
 *   wraps the findings list into the `InferenceResponse` envelope the panel
 *   consumes; it does not reshape individual findings.
 *
 *   Anti-drift: a fixture + parity check (worklistClient.contract.test.ts /
 *   equivalent) asserts the persisted finding keys are a subset of the live
 *   `InferenceFinding` keys. If the backend ever renames a finding field, that
 *   check fails — REPORT the drift to the backend/AI slice; do NOT patch around
 *   it here by reshaping (that would silently fork the contract).
 */

import { InferenceError, InferenceFinding, InferenceResponse } from './inferenceClient';
import { getWorklistApiBaseUrl } from '../config/worklist';

const SESSION_KEY = 'blackvoxel_jwt';
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * The persisted AIResult as returned on the worklist detail payload
 * (1_platform `WorklistAIResult`). `findings` is the field-aligned per-finding
 * list (see file header) — typed as `InferenceFinding[]` because that IS the
 * shape; the backend types it `list` (untyped passthrough of the proxy blob).
 */
export interface WorklistAIResult {
  model_version: string;
  findings: InferenceFinding[];
  gradcam_ref: string | null;
  report_draft_ref: string | null;
  is_research: boolean;
  created_at: string;
}

/** The worklist detail payload: the §6 WorklistItem row + latest AIResult. */
export interface WorklistItemDetail {
  study_instance_uid: string;
  modality: string | null;
  ai_status: string;
  worklist_status: string;
  finding_summary: string | null;
  ai_result: WorklistAIResult | null;
  // Other §6 WorklistItem fields exist on the wire but are not consumed here.
}

/**
 * Wrap a persisted AIResult into the `InferenceResponse` envelope the panel
 * renders. Source-agnostic: the findings array is passed through unchanged
 * (it is already the live `InferenceFinding[]` shape — see header), so the same
 * AIFindingsPanel renders persisted and live results identically.
 *
 * `is_mock` is forced false (a persisted result is a real model run), and a
 * `report_draft` placeholder is supplied because the panel's type requires it;
 * the persisted lane shows findings + Grad-CAM, not a fabricated draft. The
 * provenance flag (`source: 'persisted'`) is set by the caller, not here.
 */
export function toInferenceResponse(ai: WorklistAIResult, studyUid: string): InferenceResponse {
  return {
    study_uid: studyUid,
    model_version: ai.model_version,
    findings: ai.findings,
    // The persisted lane carries findings + Grad-CAM, not a stored draft. The
    // panel's report draft stays empty for persisted results (the draft is a
    // live-inference artifact); the collapsible section renders blank sections
    // rather than fabricating clinical text (SD-004).
    report_draft: { tecnica: '', achados: '', impressao: '' },
    inference_time_ms: 0,
    is_mock: false,
    is_research: ai.is_research,
  };
}

/**
 * Fetch the worklist detail (incl. latest persisted AIResult) for a study.
 *
 * Returns `null` (graceful no-op) when the study is unknown to the registry
 * (404) or the worklist API is disabled platform-side (`WORKLIST_ENABLED`
 * false → typically 404/403). The caller then falls back to live inference.
 *
 * @throws InferenceError on 401 (after triggering the SSO redirect) and on
 *         unexpected (non-401/403/404) API errors — the caller treats a thrown
 *         error like "no persisted result" and falls back to live inference,
 *         so a worklist outage never breaks the existing CXR path.
 */
export async function getWorklistDetail(studyUid: string): Promise<WorklistItemDetail | null> {
  const jwt = sessionStorage.getItem(SESSION_KEY);
  if (!jwt) {
    throw new InferenceError('No auth token in session');
  }

  const baseUrl = getWorklistApiBaseUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/worklist/${encodeURIComponent(studyUid)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/json',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new InferenceError('Request timed out');
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new InferenceError(message);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401) {
      // Same INT-05 SSO handoff as inferenceClient: evict the stale token and
      // bounce through login, returning the user to this exact viewer URL.
      sessionStorage.removeItem(SESSION_KEY);
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = `https://blackvoxel.ai/login?redirect=${redirect}`;
      throw new InferenceError('Unauthorized', 401);
    }
    if (response.status === 404 || response.status === 403) {
      // Study not in the registry, or worklist API disabled → no persisted
      // result. Graceful no-op; caller falls back to live inference.
      return null;
    }
    throw new InferenceError(`Worklist API error ${response.status}`, response.status);
  }

  return response.json() as Promise<WorklistItemDetail>;
}
