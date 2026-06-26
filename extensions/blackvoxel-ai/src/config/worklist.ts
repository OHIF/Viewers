/**
 * MIMPS-40 — viewer-side worklist-integration gate.
 *
 * Master kill-switch for the modality-integration worklist behavior in the
 * viewer (registry metadata enrichment + the persisted-AIResult fetch of
 * MIMPS-42). Ships DARK: default FALSE.
 *
 * Unlike CLINICAL_MODE_ENABLED / CONDUTA_SUS_ENABLED (which read a build-time
 * `process.env` flag wired through webpack's DefinePlugin), this gate is read
 * from `window.config.blackvoxelWorklist` — the runtime app config emitted as
 * /app-config.js from `platform/app/public/config/blackvoxel.js`. That config
 * file loads before the bundle, so the value is available the moment any panel
 * renders, and toggling it needs no rebuild of the extension and no edit to the
 * shared webpack config (which is out of this slice's scope). This is the
 * canonical OHIF way to pass deployment config to an extension.
 *
 * With the gate off (the default), the worklist client never fires, the viewer
 * list is driven solely by QIDO-RS/Orthanc exactly as today, and the demo set
 * is untouched (SD-001). Enabling it surfaces registry-backed behavior and
 * depends on the platform's own `WORKLIST_ENABLED` (default false) for the API
 * to answer — so the seam is dark unless BOTH sides are explicitly enabled.
 */

interface BlackVoxelWorklistConfig {
  enabled?: boolean;
  apiBaseUrl?: string | null;
}

function readWorklistConfig(): BlackVoxelWorklistConfig {
  // window.config is set by /app-config.js (blackvoxel.js) before the bundle
  // mounts. Read defensively — any shape mismatch falls back to OFF.
  const cfg = (globalThis as { config?: { blackvoxelWorklist?: unknown } }).config;
  const raw = cfg?.blackvoxelWorklist;
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  return raw as BlackVoxelWorklistConfig;
}

/**
 * Whether the worklist-integration behavior is enabled for this deployment.
 * Only the literal boolean `true` enables it; anything else (unset, false,
 * truthy-but-not-true) stays OFF.
 */
export function isWorklistEnabled(): boolean {
  return readWorklistConfig().enabled === true;
}

/**
 * Base URL for the platform worklist API. Falls back to the same default the
 * inference client uses (`BLACKVOXEL_API_URL` env → https://blackvoxel.ai), so
 * a single platform origin serves both inference and worklist by default.
 */
export function getWorklistApiBaseUrl(): string {
  const configured = readWorklistConfig().apiBaseUrl;
  if (typeof configured === 'string' && configured.length > 0) {
    return configured.replace(/\/+$/, '');
  }
  const envBase = process.env.BLACKVOXEL_API_URL as string | undefined;
  return (envBase ?? 'https://blackvoxel.ai').replace(/\/+$/, '');
}
