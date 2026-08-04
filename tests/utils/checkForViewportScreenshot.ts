import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { checkForScreenshot, type CheckForScreenshotProps } from './checkForScreenshot';

/**
 * The category of text to hide before taking a viewport screenshot.
 *
 * - `'all'`              — hides overlay, annotation, and orientation marker text.
 * - `'overlay'`          — hides all four viewport overlay corners.
 * - `'annotation'`       — hides SVG annotation text boxes.
 * - `'orientationMarker'`— hides orientation marker labels (e.g. A/P/L/R/H/F).
 */
export type HideTextOption = 'all' | 'overlay' | 'annotation' | 'orientationMarker';

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
  annotation: vp => vp.hideAnnotationText(),
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
