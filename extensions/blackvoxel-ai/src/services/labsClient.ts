/**
 * labsClient.ts (MIMPS-34)
 *
 * Fetch-based client for the BlackVoxel 4_labs FHIR clinical-context connector
 * (`fhir.blackvoxel.ai`). Mirrors `inferenceClient.ts` exactly: no axios, the
 * same `blackvoxel_jwt` sessionStorage token, an 8s AbortController timeout, and
 * the INT-05 401 → SSO handoff. Used only in CLINICAL mode (CLINICAL_MODE_ENABLED).
 *
 * Graceful degradation (the feature ships DARK):
 *   - `BLACKVOXEL_4LABS_URL` unset           → no-op, resolves null (no fetch).
 *   - 503 (LABS_FHIR_ENABLED=false, kill)    → no-op, resolves null.
 *   - consent=false                           → caller must not fetch; the
 *     backend also 403s with no FHIR call. We surface 403 as null (no context).
 *   - 401                                     → evict token + SSO redirect.
 *
 * Privacy: the request carries a FHIR `patient_ref` (Patient/{id}), NEVER a CPF,
 * and the response is the de-identified, ephemeral ClinicalContext shape (see
 * inferenceClient.ts / the 2026-06-22 contract §2). Nothing is persisted here.
 */

import { ClinicalContext, InferenceError } from './inferenceClient';

const SESSION_KEY = 'blackvoxel_jwt';
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Fetch the de-identified clinical context for a study from the 4_labs FHIR
 * connector. Returns `null` (graceful no-op) when the lane is unconfigured
 * (`BLACKVOXEL_4LABS_URL` unset), disabled (503), or consent is absent (403).
 *
 * @param study_uid   Study Instance UID (required).
 * @param patient_ref FHIR `Patient/{id}` (never a CPF), or null when unknown.
 * @param consent     The user-confirmed consent flag — REQUIRED true before any
 *                    fetch. When false we still call so the backend can 403 +
 *                    audit, but the caller (PatientContextPanel) gates the call
 *                    behind the consent toggle so this never fires unconsented.
 * @throws InferenceError on 401 (after triggering the SSO redirect) and on
 *         unexpected (non-401/403/503) API errors.
 */
export async function getPatientContext(
  study_uid: string,
  patient_ref: string | null,
  consent: boolean
): Promise<ClinicalContext | null> {
  const baseUrl = process.env.BLACKVOXEL_4LABS_URL as string | undefined;
  if (!baseUrl) {
    // Lane unconfigured — graceful no-op (ships dark).
    return null;
  }

  const jwt = sessionStorage.getItem(SESSION_KEY);
  if (!jwt) {
    throw new InferenceError('No auth token in session');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const params = new URLSearchParams({
    study_uid,
    consent: String(consent),
  });
  if (patient_ref) {
    params.set('patient_ref', patient_ref);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/context?${params.toString()}`, {
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
    if (response.status === 503) {
      // LABS_FHIR_ENABLED=false — graceful no-op; the panel hides the section.
      return null;
    }
    if (response.status === 403) {
      // consent missing — no FHIR call was made server-side; no context.
      return null;
    }
    throw new InferenceError(`Labs API error ${response.status}`, response.status);
  }

  // Envelope: { data: ClinicalContext | null, error, metadata }.
  const body = (await response.json()) as { data?: ClinicalContext | null };
  return body?.data ?? null;
}
