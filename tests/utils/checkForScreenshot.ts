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
  for (let i = 1; i < attempts; i++) {
    try {
      await expect(locator).toHaveScreenshot(screenshotPath, {
        maxDiffPixelRatio: 0.1,
      });
      return true;
    } catch (error) {
      if (i === attempts) {
        throw new Error('Screenshot does not match.');
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export { checkForScreenshot };
