/**
 * How the viewport fidelity indicator presents itself on `viewportOverlay.*`.
 *
 * - `icon` — CS3D-style glyph only
 * - `text` — OHIF clinician label only
 * - `both` — glyph and OHIF label (default)
 *
 * Aria-label and tooltip always carry the words. Removing the indicator
 * entirely is done by clearing `viewportOverlay.topRight` (VF-CFG-1), not
 * with this key.
 */
export type FidelityIndicatorDisplay = 'icon' | 'text' | 'both';

export default {
  'cornerstone.fidelityIndicator.display': 'both' as FidelityIndicatorDisplay,
};
