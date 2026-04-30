import { Page } from 'playwright-test-coverage';

/**
 * Visit the study
 * @param page - The page to interact with
 * @param title - The study instance UID of the study to visit
 * @param mode - The mode to visit the study in
 * @param delay - The delay to wait after visiting the study
 * @param datasources - the data source to load the study from
 */
export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  mode: string,
  delay: number = 0,
  datasources = 'ohif'
) {
  // await page.goto(`/?resultsPerPage=100&datasources=${datasources}`);
  // await page.getByTestId(studyInstanceUID).click();
  // await page.getByRole('button', { name: mode }).click();
  await page.goto(`/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(delay);
}
