import { Page } from 'playwright-test-coverage';

const VIEWPORT_RENDER_TIMEOUT = 60_000;

/**
 * Visit the study
 * @param page - The page to interact with
 * @param studyInstanceUID - The study instance UID of the study to visit
 * @param mode - The mode to visit the study in
 * @param delay - The delay to wait after visiting the study (deprecated, use viewport render wait)
 * @param datasources - the data source to load the study from
 */
export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  mode: string,
  delay: number = 0,
  datasources = 'ohif'
) {
  await page.goto(`/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  await page.waitForFunction(
    () => {
      const win = globalThis as unknown as { cornerstone?: { getEnabledElements: () => { viewport?: { viewportStatus?: unknown } }[]; Enums?: { ViewportStatus?: { RENDERED?: number } } } };
      const cornerstone = win.cornerstone;
      if (!cornerstone) return false;

      const viewports = cornerstone.getEnabledElements?.() ?? [];
      if (viewports.length === 0) return false;

      const RENDERED = cornerstone.Enums?.ViewportStatus?.RENDERED;
      const allRendered = viewports.every(ee => {
        const status = (ee.viewport as { viewportStatus?: unknown })?.viewportStatus;
        return RENDERED != null && status === RENDERED;
      });

      return allRendered;
    },
    { timeout: VIEWPORT_RENDER_TIMEOUT }
  );
}
