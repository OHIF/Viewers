const CUSTOMIZATION_ID = 'cornerstone.segmentation.autoHydrateViewportTypes';

/**
 * The customization is written in OHIF viewport types (the vocabulary of a
 * hanging protocol's `viewportOptions.viewportType`: 'stack', 'volume',
 * 'volume3d', ...), because that is the vocabulary a site configures in.
 *
 * Cornerstone's own enum is a different vocabulary and is not usable as the key:
 * 'orthographic' is what a 'volume' viewport becomes, and under
 * `useNextViewports` every planar viewport - stack and MPR alike - collapses to
 * 'planarNext', which no configured list could name. So callers pass the OHIF
 * type, and the few aliases that can still reach here are folded in.
 *
 * 'planarNext' deliberately maps to undefined rather than to a type: it is
 * genuinely ambiguous (stack or volume), and guessing would gate viewports a
 * site never meant to exclude.
 */
const TYPE_ALIASES: Record<string, string | undefined> = {
  orthographic: 'volume',
  volume3dnext: 'volume3d',
  videonext: 'video',
  wholeslidenext: 'wholeslide',
  ecgnext: 'ecg',
  planarnext: undefined,
};

function normalizeViewportType(viewportType?: string): string | undefined {
  if (!viewportType) {
    return undefined;
  }

  const lower = viewportType.toLowerCase();

  return lower in TYPE_ALIASES ? TYPE_ALIASES[lower] : lower;
}

/**
 * Whether a hydrated segmentation may be shown automatically in a viewport of
 * this type.
 *
 * Reads the `cornerstone.segmentation.autoHydrateViewportTypes` customization,
 * which is `null` by default meaning "every type that can render it". A site
 * that lists types narrows automatic hydration to those, which is how the
 * expensive cases are opted out of (surface generation for a 3D viewport)
 * without preventing a user from adding the segmentation there by hand.
 */
export function isAutoHydrateViewportType({
  viewportType,
  customizationService,
}: {
  viewportType?: string;
  customizationService;
}): boolean {
  const allowedTypes = customizationService?.getCustomization(CUSTOMIZATION_ID);

  if (!Array.isArray(allowedTypes)) {
    return true;
  }

  const normalized = normalizeViewportType(viewportType);

  // A viewport whose type we cannot determine is not excluded: the list is a
  // narrowing of known types, not an allowlist to fail closed on.
  if (!normalized) {
    return true;
  }

  return allowedTypes.some(allowed => normalizeViewportType(allowed) === normalized);
}
