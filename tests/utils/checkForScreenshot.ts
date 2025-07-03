import { expect } from 'playwright-test-coverage';
import { Locator, Page } from 'playwright';

type CheckForScreenshotProps = {
  page: Page;
  locator: Locator | Page;
  screenshotPath: string;
  attempts?: number;
  delay?: number;
  maxDiffPixelRatio?: number;
  threshold?: number;
};

const _checkForScreenshot = async (props: CheckForScreenshotProps) => {
  const {
    page,
    locator,
    screenshotPath,
    attempts = 10,
    delay = 500,
    maxDiffPixelRatio = 0.02,
    threshold = 0.05,
  } = props;

  await page.waitForLoadState('networkidle');

  for (let i = 0; i < attempts; i++) {
    try {
      await expect(locator).toHaveScreenshot(screenshotPath, {
        maxDiffPixelRatio,
        threshold,
      });
      return true;
    } catch (error) {
      if (i === attempts - 1) {
        console.debug('Screenshot comparison failed after all attempts');
        throw error; // Throw the original error with details instead of a generic message
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This is a fallback in case the loop exits unexpectedly
  throw new Error('Screenshot comparison failed: loop exited without match or proper error');
};

/**
 * @param page - The page to interact with
 * @param locator - The element to check for screenshot
 * @param screenshotPath - The path to save the screenshot
 * @param attempts - The number of attempts to check for screenshot
 * @param delay - The delay between attempts
 * @returns  True if the screenshot matches, otherwise throws an error
 */
const checkForScreenshot = async (
  pageOrProps: Page | CheckForScreenshotProps,
  locator?: Locator | Page,
  screenshotPath?: string,
  attempts?: number,
  delay?: number
) => {
  if (typeof pageOrProps === 'object' && 'page' in pageOrProps) {
    return await _checkForScreenshot(pageOrProps as CheckForScreenshotProps);
  } else {
    return await _checkForScreenshot({
      page: pageOrProps as Page,
      locator,
      screenshotPath,
      attempts,
      delay,
    });
  }
};

export { checkForScreenshot };
