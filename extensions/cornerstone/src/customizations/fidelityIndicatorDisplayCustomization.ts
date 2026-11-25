/**
 * How the viewport fidelity indicator presents itself on `viewportOverlay.*`.
 *
 * - `icon` — glyph only (default): yellow warning while lossy, green check when recovered
 * - `text` — OHIF clinician label only
 * - `both` — glyph and OHIF label
 *
 * Aria-label and tooltip always carry the words. Removing the indicator
 * entirely is done by clearing or overriding the FidelityIndicator entry on
 * `viewportOverlay.topRight` (VF-CFG-1), not with this key.
 */
export type FidelityIndicatorDisplay = 'icon' | 'text' | 'both';

export default {
  'cornerstone.fidelityIndicator.display': 'icon' as FidelityIndicatorDisplay,
};
