import type { IViewportPageObject } from '../pages/ViewportPageObject';
import { checkForScreenshot, type CheckForScreenshotProps } from './checkForScreenshot';

type CheckForViewportScreenshotProps = Omit<CheckForScreenshotProps, 'beforeAttempt'> & {
  viewport: IViewportPageObject;
  /**
   * When true (default), hides all viewport text before each screenshot attempt
   * and restores it afterward. Pass false to leave text visible.
   */
  hideText?: boolean;
};

/**
 * Viewport-scoped screenshot comparison. By default hides all viewport text
 * before capture, then restores it.
 * Delegates to `checkForScreenshot` for retry logic and pixel comparison.
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
