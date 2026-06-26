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
  const raw = process.env.CONDUTA_SUS_ENABLED as string | undefined;
  return raw === 'true' || raw === '1';
}

/**
 * Whether the Conduta SUS panel is enabled in this build. Constant for the
 * session — the flag is a build-time env, not a runtime toggle.
 */
export const CONDUTA_SUS_ENABLED: boolean = readCondutaSusEnabled();
