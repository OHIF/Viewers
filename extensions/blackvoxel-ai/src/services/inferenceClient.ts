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
}

export interface ReportDraft {
  tecnica: string;
  achados: string;
  impressao: string;
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
