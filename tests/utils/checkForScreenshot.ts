import { expect } from 'playwright-test-coverage';
import { Locator, Page } from 'playwright';

type CheckForScreenshotProps = {
  page: Page;
  locator?: Locator | Page;
  screenshotPath: string;
  attempts?: number;
  delay?: number;
  maxDiffPixelRatio?: number;
  threshold?: number;
  normalizedClip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fullPage?: boolean;
};

const _checkForScreenshot = async (props: CheckForScreenshotProps) => {
  const {
    page,
    screenshotPath,
    attempts = 10,
    delay = 500,
    maxDiffPixelRatio = 0.02,
    threshold = 0.05,
    normalizedClip,
    fullPage = false,
  } = props;

  let { locator = page } = props;

  await page.waitForLoadState('networkidle');

  for (let i = 0; i < attempts; i++) {
    try {
      let clip;
      if (normalizedClip) {
        let boundingBox;
        if (locator === page) {
          boundingBox = { x: 0, y: 0, ...(await page.viewportSize()) };
        } else {
          boundingBox = await (locator as Locator).boundingBox();

          // clip does not work for locator screen shots, so lets do some trickery
          // set page as the locator here and below add the locator bounding box origin to the
          // clip area
          locator = page;
        }

        clip = {
          x: boundingBox.x + normalizedClip.x * boundingBox.width,
          y: boundingBox.y + normalizedClip.y * boundingBox.height,
          width: normalizedClip.width * boundingBox.width,
          height: normalizedClip.height * boundingBox.height,
        };
      }

      await expect(locator).toHaveScreenshot(screenshotPath, {
        maxDiffPixelRatio,
        threshold,
        clip,
        fullPage,
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
 * Checks if a screenshot of a specific element matches the expected screenshot.
 * It retries the check for a specified number of attempts with a delay between each attempt.
 * By default, the number of attempts is 10 and the delay is 500 milliseconds which results in a maximum wait time of 5 seconds.
 * Instead of sleeping idle prior to calling this function, simply adjust the attempts and delay parameters to achieve the desired wait time.
 * @param pageOrProps - The page to interact with or an object containing page and other properties
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
