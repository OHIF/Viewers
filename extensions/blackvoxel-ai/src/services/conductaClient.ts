/**
 * conductaClient.ts (SUS-12)
 *
 * Fetch-based client for the BlackVoxel "Conduta SUS" capability. Sibling to
 * inferenceClient.ts / labsClient.ts — no axios, the same `blackvoxel_jwt`
 * sessionStorage token, an 8s AbortController timeout, and the INT-05 401 → SSO
 * handoff. Ships DARK.
 *
 * It POSTs to the PLATFORM proxy (SUS-11) — `POST /api/v1/conduta/{draft,submit}`
 * — which forwards over HTTP to the standalone 5_sus service (conduta_sus).
 * The platform passes the upstream 5_sus JSON through VERBATIM (it does NOT wrap
 * it in a {data,error,metadata} envelope like 4_labs does), so the response we
 * parse is the contract's own `{ ok, ... }` shape (see 5_sus service-contract.md
 * / docs/openapi.json). The wire shapes below are field-identical (snake_case)
 * to that contract; do NOT rename a field without updating the contract.
 *
 * Governance — read first. $0 / offline / decision-SUPPORT only / claims:"none"
 * (CLINICAL_SCOPE_SUS.md, SD-004). The AI drafts → the physician SIGNS (the read
 * is signed BEFORE it reaches this seam) → the *médico regulador* decides. An
 * unsigned read NEVER produces a draft (hard invariant #1, enforced upstream).
 * `submit` reaches NO real RNDS — the in-process MockRndsConnector, environment
 * is always "mock"; `accepted` is a STRUCTURAL signal, not a clinical/regulatory
 * acceptance.
 *
 * Graceful degradation (the feature ships DARK):
 *   - 503 (CONDUTA_SUS_ENABLED=false OR CONDUTA_SUS_SERVICE_URL unset, kill) →
 *     CondutaDisabledError so the panel renders "Conduta SUS indisponível".
 *   - 502 (upstream/transport failure) → a typed structured error.
 *   - 401 → evict the stale token + SSO redirect (same handoff as inference).
 *   - request/draft defect (unsigned_report / bad_request / …) → the contract
 *     returns it as HTTP 200 with `ok:false`; we surface it as a typed result,
 *     never a thrown error, so the panel can branch on `error.code`.
 *
 * claims:none.
 */

const SESSION_KEY = 'blackvoxel_jwt';
const REQUEST_TIMEOUT_MS = 8_000;

// ---------------------------------------------------------------------------
// Wire shapes — field-identical to 5_sus/docs/openapi.json (snake_case).
// ---------------------------------------------------------------------------

/** The supported pathways on THIS seam. 'triage' is rejected upstream (it ranks
 *  many reads, not one bundle) — the panel's Triagem card is informational and
 *  never calls draft/submit. */
export type CondutaPathway = 'acute' | 'chronic';

/** A PHYSICIAN-CONFIRMED finding from the signed read — never an AI score (#2). */
export interface CondutaFinding {
  code: string;
  label_pt: string;
  cid10?: string | null;
  /** Defaults true upstream. */
  present?: boolean;
  /** Physician qualifier (e.g. "volumoso"), NOT a probability. */
  severity?: string | null;
}

/** Patient demographics, keyed by CNS (the SUS patient key). */
export interface CondutaPatient {
  cns: string;
  cpf?: string | null;
  name?: string | null;
  birth_date?: string | null;
  sex?: string | null;
}

/** The signing physician (laudo author / requester). */
export interface CondutaPractitioner {
  cns: string;
  crm: string;
  uf: string;
  rqe?: string | null;
  cbo?: string | null;
}

/** Originating health establishment, keyed by CNES. */
export interface CondutaEstablishment {
  cnes: string;
  name?: string | null;
}

/**
 * The ONLY input — a physician-signed read. `signed` MUST be exactly true, else
 * the upstream returns `unsigned_report` and NEVER a draft (#1). The viewer must
 * not assemble this from an unsigned read.
 */
export interface SignedReport {
  study_uid: string;
  /** MUST be exactly true. */
  signed: boolean;
  signed_at?: string;
  impression_pt: string;
  /** >= 1 physician-confirmed finding. */
  findings: CondutaFinding[];
  patient: CondutaPatient;
  practitioner: CondutaPractitioner;
  establishment: CondutaEstablishment;
  /** DICOMweb/WADO REFERENCE only — pixels stay in Orthanc (#5). */
  imaging_study_wado_url?: string | null;
}

/** Request body for BOTH /conduta/draft and /conduta/submit. */
export interface CondutaRequest {
  pathway: CondutaPathway;
  report: SignedReport;
  /** Requested bed/leito (acute) or specialty (chronic); pathway-default if omitted. */
  specialty_or_bed?: string | null;
  /** INJECTED ISO-8601 Bundle.timestamp (determinism, #3). */
  timestamp?: string | null;
  /** Optional override priority-rules table. */
  rules?: Record<string, unknown> | null;
  /** Optional pt-BR clinical justification. */
  justificativa_pt?: string | null;
}

/** SUS Prioridade 0-3 (lower = more urgent). */
export type CondutaPriority = 0 | 1 | 2 | 3;
export type CondutaPriorityName = 'EMERGENCIA' | 'URGENCIA' | 'NAO_URGENTE' | 'ELETIVA';
/** Waiting-list cor. */
export type CondutaColor = 'vermelho' | 'amarelo' | 'verde' | 'azul';

/** Success body of POST /conduta/draft (ok:true). */
export interface CondutaDraftSuccess {
  ok: true;
  pathway: CondutaPathway;
  specialty_or_bed: string;
  priority: CondutaPriority;
  priority_name: CondutaPriorityName;
  color: CondutaColor;
  /** The matched transparent rule id (audit/contestation record). */
  rule_id: string;
  rationale: string;
  /** Always true — the suggestion is ALWAYS editable; the médico/regulador decides. */
  editable: true;
  justificativa_pt: string;
  /** FHIR R4 transaction Bundle (resourceType=Bundle, type=transaction). */
  bundle: Record<string, unknown>;
  /** Structural problems; empty = structurally ok (homologação-shaped). */
  validation_problems: string[];
  claims: 'none';
}

/** Success body of POST /conduta/submit (ok:true). */
export interface CondutaSubmitSuccess {
  ok: true;
  pathway: CondutaPathway;
  /** MOCK-HOMOLOG-… on acceptance; null on rejection. */
  tracking_id: string | null;
  /** STRUCTURAL signal only (claims:none), NOT a clinical/regulatory acceptance. */
  accepted: boolean;
  /** ALWAYS "mock" in the $0 build; real RNDS is founder-gated. */
  environment: 'mock';
  problems: string[];
  priority: CondutaPriority;
  priority_name: CondutaPriorityName;
  color: CondutaColor;
  rule_id: string;
  validation_problems: string[];
  claims: 'none';
}

/** Stable error codes — branch on these, not the prose. */
export type CondutaErrorCode =
  | 'bad_request'
  | 'unknown_pathway'
  | 'unsigned_report'
  | 'contract_error'
  | 'not_found'
  | 'payload_too_large';

/** Body-level error (HTTP 200 with ok:false) — a request/draft defect. */
export interface CondutaErrorResult {
  ok: false;
  error: {
    code: CondutaErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
  claims: 'none';
}

export type CondutaDraftResult = CondutaDraftSuccess | CondutaErrorResult;
export type CondutaSubmitResult = CondutaSubmitSuccess | CondutaErrorResult;

/**
 * Type guard: is this a body-level (ok:false) error result? Use this to branch
 * a draft/submit result into the error vs. success variant — it narrows
 * reliably (independent of control-flow inference) at the call site.
 */
export function isCondutaError(
  result: CondutaDraftResult | CondutaSubmitResult
): result is CondutaErrorResult {
  return result.ok === false;
}

// ---------------------------------------------------------------------------
// Errors (thrown — distinct from the body-level ok:false results above).
// ---------------------------------------------------------------------------

/** Generic transport/API error (401 / 502 / non-JSON / timeout). */
export class CondutaError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'CondutaError';
  }
}

/**
 * The Conduta SUS lane is disabled (503): CONDUTA_SUS_ENABLED=false OR
 * CONDUTA_SUS_SERVICE_URL unset on the platform. The panel catches this and
 * renders "Conduta SUS indisponível" — a clean no-op, never an error toast.
 */
export class CondutaDisabledError extends CondutaError {
  constructor(message = 'Conduta SUS disabled') {
    super(message, 503);
    this.name = 'CondutaDisabledError';
  }
}

// ---------------------------------------------------------------------------
// Internal POST helper — mirrors getInference/classifyMeasurements.
// ---------------------------------------------------------------------------

async function postConduta<T>(action: 'draft' | 'submit', request: CondutaRequest): Promise<T> {
  const jwt = sessionStorage.getItem(SESSION_KEY);
  if (!jwt) {
    throw new CondutaError('No auth token in session');
  }

  // Literal read for DefinePlugin; try/catch fail-safe so a missing define never
  // throws `process is not defined` (degrades to the default platform origin).
  let baseUrl: string;
  try {
    baseUrl = (process.env.BLACKVOXEL_API_URL as string | undefined) ?? 'https://blackvoxel.ai';
  } catch {
    baseUrl = 'https://blackvoxel.ai';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/conduta/${action}`, {
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
      throw new CondutaError('Request timed out');
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new CondutaError(message);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401) {
      // Same INT-05 SSO handoff as inferenceClient/labsClient: evict the stale
      // token and bounce through login, returning the user to this viewer URL.
      sessionStorage.removeItem(SESSION_KEY);
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = `https://blackvoxel.ai/login?redirect=${redirect}`;
      throw new CondutaError('Unauthorized', 401);
    }
    if (response.status === 503) {
      // CONDUTA_SUS_ENABLED=false / URL unset — graceful no-op (ships dark).
      throw new CondutaDisabledError();
    }
    // 502 (upstream/transport) and any other status → typed error. The panel
    // surfaces a neutral "could not reach the service" message; no draft.
    throw new CondutaError(`Conduta SUS API error ${response.status}`, response.status);
  }

  // HTTP 200: the platform passes the 5_sus JSON through verbatim. This is the
  // contract's own envelope — `{ ok:true, ... }` on success or `{ ok:false,
  // error:{...} }` on a request/draft defect (unsigned_report, bad_request …).
  // Both are returned to the caller (NOT thrown) so the panel branches on `ok`.
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a SUS regulation draft from a physician-signed read. Does NOT submit.
 * Returns the contract's `ok:true` draft OR an `ok:false` body-level error
 * (e.g. `unsigned_report` — never a draft from an unsigned read, #1).
 *
 * @throws CondutaDisabledError on 503 (lane disabled — ships dark).
 * @throws CondutaError on 401 (after the SSO redirect), 502, timeout, or a
 *         non-JSON/unexpected transport failure.
 */
export async function condutaDraft(request: CondutaRequest): Promise<CondutaDraftResult> {
  return postConduta<CondutaDraftResult>('draft', request);
}

/**
 * Build a draft THEN submit it via the mock RNDS connector. Runs build_draft
 * first upstream, so every draft-time error (incl. `unsigned_report`) is
 * returned verbatim — no draft, no submit (#1 holds transitively). Returns the
 * homologação-shaped `ok:true` result OR an `ok:false` body-level error.
 *
 * This must ONLY be called after an explicit physician confirm step in the UI —
 * NEVER auto-sent. The *médico regulador* decides; this is decision SUPPORT.
 *
 * @throws CondutaDisabledError on 503 (lane disabled — ships dark).
 * @throws CondutaError on 401 (after the SSO redirect), 502, timeout, or a
 *         non-JSON/unexpected transport failure.
 */
export async function condutaSubmit(request: CondutaRequest): Promise<CondutaSubmitResult> {
  return postConduta<CondutaSubmitResult>('submit', request);
}
