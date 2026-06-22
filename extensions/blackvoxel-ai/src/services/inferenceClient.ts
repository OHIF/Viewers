/**
 * inferenceClient.ts
 *
 * Fetch-based client for the BlackVoxel AI inference API.
 * No axios — keeps the extension dependency-free.
 *
 * Auth flow: reads the JWT stored by jwtBridge.ts from sessionStorage.
 * On 401 the client evicts the stale token and hard-redirects to login
 * so the user re-authenticates without seeing a confusing error state.
 */

export interface InferenceRequest {
  study_uid: string;
  series_uid: string;
  modality: string;
  image_data_url?: string;
  image_id?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Normalized [0,1] region of interest (CXR-10 Grad-CAM). Resolution-independent. */
export interface NormRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * CXR-3x: box-extractor provenance, e.g. "gradcam-cc-v1" when the
   * connected-component peak-grow extractor produced the region; absent/null on
   * the legacy global-0.5 lane. Internal/audit only — NEVER surfaced as a
   * user-facing number or claim (SD-004). Additive + optional: old JSON (no
   * method) parses unchanged and rendering ignores this field entirely.
   */
  method?: string | null;
}

export interface InferenceFinding {
  label: string;
  confidence: number;
  /**
   * Pixel-space box on the analyzed frame, or null when the model lane has no
   * localization (the live proxy-txv-v1 classifier returns null on every
   * finding). Never synthesize a box when this is null.
   */
  bounding_box: BoundingBox | null;
  severity: string;
  /** CXR-09: English source pathology + calibration band. */
  label_en?: string;
  band?: 'provável' | 'indeterminado' | 'improvável' | string;
  /** CXR-10: coarse Grad-CAM region (normalized), present findings only. */
  region?: NormRegion | null;
  /**
   * CXR-31/32: anatomy grounding of the Grad-CAM region onto proxy-seg-v1 lung
   * masks — explanatory location only (não-diagnóstico, SD-004). Absent unless
   * the backend SEG_ENABLED lane ran; old JSON (no keys) stays compatible.
   */
  laterality?: 'right' | 'left' | string | null;
  zone?: 'upper' | 'mid' | 'lower' | string | null;
}

export interface ReportDraft {
  tecnica: string;
  achados: string;
  impressao: string;
  /**
   * MIMPS-30: optional Medições subsection, assembled client-side from
   * CONFIRMED measurements (never written by the model). Backward-compatible —
   * absent on legacy/image-only drafts.
   */
  medicoes?: string;
}

// ---------------------------------------------------------------------------
// MIMPS-28: measurement classification (POST /api/v1/measurement/classify)
//
// The 7 interfaces below are field-identical (byte-for-byte snake_case) to the
// CXR-35 backend (`schemas.py`) and the model dicts (`measure.py`). See the
// contract: 2026-06-21-measure-report-contract.md. Do not re-derive names.
// ---------------------------------------------------------------------------

/** One ruler measurement, in PIXEL coords on the analyzed (512) frame. */
export interface MeasuredValue {
  /** Echoes the OHIF measurement.uid. */
  id: string;
  /** Two [x=col, y=row] pixel pairs on the 512 analyzed frame, top-left origin. */
  points_px: [[number, number], [number, number]];
  length_px: number;
  /** [rowSpacing, colSpacing] mm/px, or null when uncalibrated (do NOT send [1,1]). */
  pixel_spacing: [number, number] | null;
}

export interface MeasurementClassifyRequest {
  study_uid: string;
  series_uid?: string | null;
  modality: string;
  /** REQUIRED — the analyzed frame as a data URL (422 if missing/empty). */
  image_data_url: string;
  image_id?: string | null;
  /** MAY be empty (study-level ICT alone). */
  measurements: MeasuredValue[];
}

/** A crossed/suggested structure with overlap + score (English key + pt-BR label). */
export interface StructureLabel {
  key: string;
  label_pt: string;
  overlap_frac: number;
  score: number;
}

/** Measured length in mm with calibration flag (always present per measurement). */
export interface MeasuredMm {
  value: number | null;
  calibrated: boolean;
  note: string;
}

/** Cardiothoracic ratio — a dimensionless geometric ratio, never a diagnosis. */
export interface IctResult {
  ict: number | null;
  cardiac_width_frac: number;
  thoracic_width_frac: number;
  measurable: boolean;
  note: string;
}

export interface MeasurementResult {
  id: string;
  suggested_structure: StructureLabel | null;
  alternatives: StructureLabel[];
  /** = [suggested] + alternatives. */
  crossed_structures: StructureLabel[];
  mm: MeasuredMm;
  disclaimer: string;
}

export interface MeasurementClassifyResponse {
  study_uid: string;
  model_version: string;
  is_research: boolean;
  inference_time_ms: number;
  /** OOD gate; true => structures NOT emitted. */
  abstain: boolean;
  abstain_reason: string | null;
  ict: IctResult | null;
  measurements: MeasurementResult[];
  disclaimer: string;
}

export interface InferenceResponse {
  study_uid: string;
  model_version: string;
  findings: InferenceFinding[];
  report_draft: ReportDraft;
  inference_time_ms: number;
  is_mock: boolean;
  is_research?: boolean;
  disclaimer?: string | null;
  /** CXR-14: findings↔report consistency gate. */
  report_verified?: boolean;
  report_warnings?: string[];
  /** CXR-13/CXR-26: which lane wrote the draft — "template" or "medgemma". */
  report_source?: string;
  /** CXR-26: whether the paid generative model is currently enabled+configured. */
  paid_report_available?: boolean;
  /** CXR-26: why the free template was used — null | "paid_disabled" | "paid_unavailable" | "guardrail_rejected". */
  report_fallback_reason?: string | null;
}

export class InferenceError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'InferenceError';
  }
}

const SESSION_KEY = 'blackvoxel_jwt';
const REQUEST_TIMEOUT_MS = 8_000;

export async function getInference(request: InferenceRequest): Promise<InferenceResponse> {
  const jwt = sessionStorage.getItem(SESSION_KEY);
  if (!jwt) {
    throw new InferenceError('No auth token in session');
  }

  const baseUrl =
    (process.env.BLACKVOXEL_API_URL as string | undefined) ?? 'https://blackvoxel.ai';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/inference`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
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
      // Evict the stale token, then bounce through the INT-05 SSO handoff so
      // the platform returns the user to this exact viewer URL after re-auth.
      sessionStorage.removeItem(SESSION_KEY);
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = `https://blackvoxel.ai/login?redirect=${redirect}`;
      throw new InferenceError('Unauthorized', 401);
    }
    throw new InferenceError(`API error ${response.status}`, response.status);
  }

  return response.json() as Promise<InferenceResponse>;
}

/**
 * MIMPS-28: classify ruler measurements against the segmentation lane.
 *
 * Mirrors `getInference`: same SESSION_KEY JWT, baseUrl, 8s AbortController,
 * and 401 → SSO redirect. When the lane is disabled the backend returns 503;
 * we surface that as `InferenceError('Segmentation disabled', 503)` so the
 * panel can no-op gracefully (the manual ruler is never blocked).
 */
export async function classifyMeasurements(
  request: MeasurementClassifyRequest
): Promise<MeasurementClassifyResponse> {
  const jwt = sessionStorage.getItem(SESSION_KEY);
  if (!jwt) {
    throw new InferenceError('No auth token in session');
  }

  const baseUrl =
    (process.env.BLACKVOXEL_API_URL as string | undefined) ?? 'https://blackvoxel.ai';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/measurement/classify`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
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
      // Same INT-05 SSO handoff as getInference: evict the stale token and
      // bounce through login, returning the user to this exact viewer URL.
      sessionStorage.removeItem(SESSION_KEY);
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = `https://blackvoxel.ai/login?redirect=${redirect}`;
      throw new InferenceError('Unauthorized', 401);
    }
    if (response.status === 503) {
      // SEG_ENABLED=false — graceful no-op; the panel hides the section.
      throw new InferenceError('Segmentation disabled', 503);
    }
    throw new InferenceError(`API error ${response.status}`, response.status);
  }

  return response.json() as Promise<MeasurementClassifyResponse>;
}
