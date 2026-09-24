import type { ViewportPageObject } from '../pages/ViewportPageObject';
import { checkForScreenshot, type CheckForScreenshotProps } from './checkForScreenshot';

type CheckForGridScreenshotProps = Omit<CheckForScreenshotProps, 'beforeAttempt'> & {
  viewportPageObject: ViewportPageObject;
  /**
   * When true (default), hides all text on every viewport in the grid before
   * each screenshot attempt and re-shows it afterward, regardless of whether
   * it was hidden beforehand. Pass false to leave text untouched.
   */
  hideText?: boolean;
};

/**
 * Grid-scoped screenshot comparison. By default hides all text on every
 * viewport in the grid before capture, then re-shows it.
 * Delegates to `checkForScreenshot` for retry logic and pixel comparison.
 *
 * @remarks
 * Text is hidden with a single selector sweep over the grid on every attempt
 * (`hideAllViewportsText`), so a layout change mid-test (e.g. switching to
 * MPR or 3D four-up) is picked up and the text of newly added viewports is
 * hidden too — without resolving per-viewport page objects, which can throw
 * while panes are being added or removed.
 *
 * **Side effect:** `hideText` (default `true`) unconditionally shows all
 * matched text elements (overlay, annotation, and orientation-marker) on
 * every pane again after the comparison, without tracking or restoring the
 * visibility state that existed before this function ran — even on failure
 * (cleanup runs in a `finally`).
 *
 * @example
 * await checkForGridScreenshot({
 *   page,
 *   viewportPageObject,
 *   screenshotPath: screenShotPaths.mpr.mprDisplayedCorrectly,
 * });
 */
export const checkForGridScreenshot = async ({
  page,
  viewportPageObject,
  screenshotPath,
  hideText = true,
  locator,
  ...rest
}: CheckForGridScreenshotProps): Promise<boolean> => {
  try {
    return await checkForScreenshot({
      page,
      locator: locator ?? viewportPageObject.grid,
      screenshotPath,
      ...rest,
      beforeAttempt: hideText ? () => viewportPageObject.hideAllViewportsText() : undefined,
    });
  } finally {
    if (hideText) {
      await viewportPageObject.showAllViewportsText();
    }
  }
};
