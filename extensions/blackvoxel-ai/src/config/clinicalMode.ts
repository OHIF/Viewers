/**
 * MIMPS-33 — CLINICAL_MODE_ENABLED flag.
 *
 * Master kill-switch for the clinical-context feature in the viewer. Ships
 * DARK: default FALSE. When false the clinical mode card stays disabled, the
 * PatientContextPanel renders inert (no demographics, no fetch), and clinical
 * inference is blocked.
 *
 * Read once at module load from `process.env.CLINICAL_MODE_ENABLED` (the same
 * build-time env mechanism the rest of the extension uses for
 * BLACKVOXEL_API_URL / BLACKVOXEL_4LABS_URL). Only the exact strings 'true' /
 * '1' enable it — anything else (unset, 'false', '0', typo) stays OFF.
 *
 * Enabling clinical mode in PROD is gated by RG-08 (founder + RA sign-off) per
 * the 2026-06-22 clinical-context FHIR contract §5. This module never lifts that
 * gate; it only reads a build-time flag that defaults closed.
 */

function readClinicalModeEnabled(): boolean {
  const raw = process.env.CLINICAL_MODE_ENABLED as string | undefined;
  return raw === 'true' || raw === '1';
}

/**
 * Whether clinical mode is enabled in this build. Constant for the session —
 * the flag is a build-time env, not a runtime toggle.
 */
export const CLINICAL_MODE_ENABLED: boolean = readClinicalModeEnabled();
