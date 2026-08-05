import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { checkForScreenshot, type CheckForScreenshotProps } from './checkForScreenshot';

type CheckForViewportScreenshotProps = Omit<CheckForScreenshotProps, 'beforeAttempt'> & {
  viewport: IViewportPageObject;
  /**
   * When true (default), hides all viewport text before each screenshot attempt
   * and re-shows it afterward, regardless of whether it was hidden beforehand.
   * Pass false to leave text untouched.
   */
  hideText?: boolean;
};

/**
 * Viewport-scoped screenshot comparison. By default hides all viewport text
 * before capture, then re-shows it.
 * Delegates to `checkForScreenshot` for retry logic and pixel comparison.
 *
 * @remarks
 * **Side effect:** `hideText` (default `true`) unconditionally shows all
 * matched text elements (overlay, annotation, and orientation-marker)
 * again after the comparison, via `viewport.showAllText()`. This does
 * not track or restore whatever visibility state existed before this
 * function ran — if a target was already hidden (e.g. by a previous
 * test step or application state), it will be visible after this call
 * returns, even on failure (cleanup runs in a `finally`).
 *
 * @example
 * await checkForViewportScreenshot({
 *   page,
 *   viewport: activeViewport,
 *   screenshotPath: screenShotPaths.length.lengthDisplayedCorrectly,
 * });
 */
export const checkForViewportScreenshot = async ({
  page,
  viewport,
  screenshotPath,
  hideText = true,
  locator,
  ...rest
}: CheckForViewportScreenshotProps): Promise<boolean> => {
  try {
    return await checkForScreenshot({
      page,
      locator: locator ?? viewport.pane,
      screenshotPath,
      ...rest,
      beforeAttempt: hideText ? () => viewport.hideAllText() : undefined,
    });
  } finally {
    if (hideText) {
      await viewport.showAllText();
    }
  }
};
