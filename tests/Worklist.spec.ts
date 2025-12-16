import { test } from 'playwright-test-coverage';
import { checkForScreenshot, screenShotPaths } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto(`/?datasources=ohif`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
});

test('should render scroll bars with the correct look-and-feel', async ({ page }) => {
  const studyRowHeader = await page.getByTestId(
    '1.3.6.1.4.1.14519.5.2.1.5099.8010.217836670708542506360829799868'
  );

  await studyRowHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);

  await studyRowHeader.click();

  const expandedStudyRow = await page.getByTestId(
    'studyRow-1.3.6.1.4.1.14519.5.2.1.5099.8010.217836670708542506360829799868'
  );

  // Wait for the expanded row to be visible and rendered
  await expandedStudyRow.waitFor({ state: 'visible', timeout: 10000 });
  await expandedStudyRow.scrollIntoViewIfNeeded();

  // Wait for content to load and stabilize, including any lazy-loaded items
  await page.waitForTimeout(2000);

  // Wait for network to be idle to ensure all content is loaded
  await page.waitForLoadState('networkidle');

  // Additional wait to ensure scrollbar rendering is stable
  await page.waitForTimeout(1000);

  await checkForScreenshot({
    page,
    locator: expandedStudyRow,
    normalizedClip: { x: 0.97, y: 0.35, width: 0.03, height: 0.65 },
    screenshotPath: screenShotPaths.workList.scrollBarRenderedProperly,
  });
});
