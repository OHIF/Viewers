import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should properly display MPR for MR', async ({ page, mainToolbarPageObject }) => {
  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();

  await page.getByTestId('yes-hydrate-btn').click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(page, page, screenShotPaths.segHydrationThenMPR.segPostHydration);

  await mainToolbarPageObject.layoutSelection.axialPrimary.click();

  await page.waitForTimeout(5000);
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.segHydrationThenMPR.segPostHydrationMPRAxialPrimary
  );
});
