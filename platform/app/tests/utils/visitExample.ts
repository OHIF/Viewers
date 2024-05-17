import { Page } from '@playwright/test';

/**
 * Visit the example page
 * @param page - The page to visit
 * @param title - The title of the example page
 */
export async function visitExample(page: Page, title: string) {
  await page.goto('/');
  await page.click(`a:has-text("${title}")`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('div#content');
  await page.waitForLoadState('networkidle');
}
