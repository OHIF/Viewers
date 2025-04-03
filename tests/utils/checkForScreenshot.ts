import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

/**
 * @param page - The page to interact with
 * @param locator - The element to check for screenshot
 * @param screenshotPath - The path to save the screenshot
 * @param attempts - The number of attempts to check for screenshot
 * @param delay - The delay between attempts
 * @returns  True if the screenshot matches, otherwise throws an error
 */
const checkForScreenshot = async (
  page: Page,
  locator: Locator | Page,
  screenshotPath: string,
  attempts = 10,
  delay = 100
) => {
  await page.waitForLoadState('networkidle');

  for (let i = 0; i < attempts; i++) {
    try {
      await expect(locator).toHaveScreenshot(screenshotPath, {
        maxDiffPixelRatio: 0.1,
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

export { checkForScreenshot };
