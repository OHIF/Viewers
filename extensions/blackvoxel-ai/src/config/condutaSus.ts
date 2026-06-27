/**
 * SUS-12 — CONDUTA_SUS_ENABLED flag.
 *
 * Master kill-switch for the "Conduta SUS" viewer panel. Ships DARK: default
 * FALSE. When false the CondutaSusPanel is not registered (it does not appear in
 * the panel rail at all) and no draft/submit call can fire from the viewer.
 *
 * This is the VIEWER-side gate; it is independent of (and additional to) the
 * PLATFORM-side `CONDUTA_SUS_ENABLED` setting on the SUS-11 proxy. Even with the
 * viewer flag on, the platform proxy still 503s when its own flag is off, and
 * the panel degrades to "Conduta SUS indisponível" — so the seam is dark unless
 * BOTH sides are explicitly enabled.
 *
 * Read once at module load from `process.env.CONDUTA_SUS_ENABLED` (the same
 * build-time env mechanism as CLINICAL_MODE_ENABLED / BLACKVOXEL_API_URL). Only
 * the exact strings 'true' / '1' enable it — anything else (unset, 'false',
 * '0', typo) stays OFF.
 *
 * Enabling Conduta SUS in PROD is gated by the RNDS/RA sign-off ([RA-GATE],
 * CLINICAL_SCOPE_SUS.md). This module never lifts that gate; it only reads a
 * build-time flag that defaults closed.
 */

function readCondutaSusEnabled(): boolean {
  // Reference the LITERAL `process.env.CONDUTA_SUS_ENABLED` so webpack's
  // DefinePlugin swaps it at build time. The try/catch is the FAIL-SAFE: if the
  // matching DefinePlugin entry is ever missing, the bare `process` reference
  // throws at module load and — since this module is imported during OHIF
  // extension registration — would black-screen the whole viewer (the 2026-06-26
  // incident). Catching it degrades this dark flag to its safe default (OFF).
  let raw: string | undefined;
  try {
    raw = process.env.CONDUTA_SUS_ENABLED as string | undefined;
  } catch {
    raw = undefined; // no `process` in this build → default closed
  }
  return raw === 'true' || raw === '1';
}

/**
 * Whether the Conduta SUS panel is enabled in this build. Constant for the
 * session — the flag is a build-time env, not a runtime toggle.
 */
export const CONDUTA_SUS_ENABLED: boolean = readCondutaSusEnabled();
