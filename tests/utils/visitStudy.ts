import { Page } from '@playwright/test';

/**
 * Visit the study
 * @param page - The page to interact with
 * @param title - The study instance UID of the study to visit
 * @param mode - The mode to visit the study in
 * @param delay - The delay to wait after visiting the study
 */
export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  mode: string,
  delay: number = 0
) {
  await page.goto('/?resultsPerPage=100');
  await page.getByTestId('confirm-and-hide-button').click();
  await page.getByTestId(studyInstanceUID).click();
  await page.getByRole('button', { name: mode }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(delay);
}
