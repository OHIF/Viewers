import type { Page } from '@playwright/test';

type VisitStudyOptions = {
  mode?: string;
  delay?: number;
  datasources?: string;
  customization?: string;
};

/**
 * Visit the study
 * @param page - The page to interact with
 * @param title - The study instance UID of the study to visit
 * @param mode - The mode to visit the study in
 * @param delay - The delay to wait after visiting the study
 * @param datasources - the data source to load the study from
 */
export async function visitStudyOptions(
  page: Page,
  studyInstanceUID: string,
  options: VisitStudyOptions = {}
) {
  const mode = options.mode || 'viewer';
  const resolvedDelay = options.delay ?? 0;
  const resolvedDatasources = options.datasources || 'ohif';
  const { customization } = options;

  // await page.goto(`/?resultsPerPage=100&datasources=${datasources}`);
  // await page.getByTestId(studyInstanceUID).click();
  // await page.getByRole('button', { name: mode }).click();
  const params = new URLSearchParams({ StudyInstanceUIDs: studyInstanceUID });
  if (customization) {
    params.set('customization', customization);
  }

  await page.goto(`/${mode}/${resolvedDatasources}?${params.toString()}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(resolvedDelay);
}

export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  mode = 'viewer',
  delay: number = 0,
  datasources = 'ohif'
) {
  return visitStudyOptions(page, studyInstanceUID, {
    mode,
    delay,
    datasources,
  });
}
