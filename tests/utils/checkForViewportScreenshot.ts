import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { checkForScreenshot, type CheckForScreenshotProps } from './checkForScreenshot';

/**
 * The category of text to hide before taking a viewport screenshot.
 *
 * - `'all'`              — hides overlay, annotation, and orientation marker text.
 * - `'overlay'`          — hides all four viewport overlay corners. (all text in those corners).
 * - `'demographic'`      — hides Study date and Series description overlay items.
 * - `'annotation'`       — hides SVG annotation text boxes.
 * - `'laterality'`       — hides the Laterality overlay item (no-op in default OHIF config).
 * - `'orientationMarker'`— hides orientation marker labels (e.g. A/P/L/R/H/F).
 */
export type HideTextOption =
  | 'all'
  | 'overlay'
  | 'demographic'
  | 'annotation'
  | 'laterality'
  | 'orientationMarker';

export type HideTextInput = HideTextOption | HideTextOption[];

type CheckForViewportScreenshotProps = Omit<CheckForScreenshotProps, 'beforeAttempt'> & {
  viewport: IViewportPageObject;
  /** Which category of text to hide before capturing.
   * Defaults to `'all'`. Use checkForScreenshot directly when no text should be hidden.
   *
   * Pass an array to combine categories (e.g. `['overlay', 'orientationMarker']`).
   */
  hideText?: HideTextInput;
};

const hideTextHandlers: Record<HideTextOption, (vp: IViewportPageObject) => Promise<void>> = {
  all: vp => vp.hideAllText(),
  overlay: vp => vp.hideViewportOverlayText(),
  demographic: vp => vp.hideDemographicOverlayText(),
  annotation: vp => vp.hideAnnotationText(),
  laterality: vp => vp.hideLateralityText(),
  orientationMarker: vp => vp.hideOrientationMarkerText(),
};

async function applyHideText(
  viewport: IViewportPageObject,
  hideText: HideTextInput
): Promise<void> {
  const options = Array.isArray(hideText) ? hideText : [hideText];
  if (options.length === 0) {
    return;
  }
  if (options.includes('all')) {
    await viewport.hideAllText();
    return;
  }
  for (const option of options) {
    await hideTextHandlers[option](viewport);
  }
}

/**
 * Viewport-scoped screenshot comparison that hides text before capture.
 * Defaults to hiding all text ('all').
 * Delegates to `checkForScreenshot` for retry logic and pixel comparison.
 *
 * Use `checkForScreenshot` when nothing should be hidden.
 *
 * @example
 * await checkForViewportScreenshot({
 *   page,
 *   viewport: activeViewport,
 *   screenshotPath: screenShotPaths.length.lengthDisplayedCorrectly,
 *   hideText: 'overlay',
 * });
 */
export const checkForViewportScreenshot = async ({
  page,
  viewport,
  screenshotPath,
  hideText = 'all',
  locator,
  ...rest
}: CheckForViewportScreenshotProps): Promise<boolean> => {
  return checkForScreenshot({
    page,
    locator: locator ?? viewport.pane,
    screenshotPath,
    ...rest,
    beforeAttempt: () => applyHideText(viewport, hideText),
  });
};
