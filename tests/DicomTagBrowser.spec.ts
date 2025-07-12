import { test } from 'playwright-test-coverage';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';

test('should display the dicom tag browser', async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('TagBrowser').click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.dicomTagBrowser.dicomTagBrowserDisplayedCorrectly
  );
});

test('should render the scroll bar with the correct look-and-feel', async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('MoreTools-split-button-secondary').click();
  await page.getByTestId('TagBrowser').click();
  await checkForScreenshot({
    page,
    locator: page.getByRole('dialog'),
    normalizedClip: { x: 0.96, y: 0.2, width: 0.04, height: 0.8 },
    screenshotPath: screenShotPaths.dicomTagBrowser.scrollBarRenderedProperly,
  });
});
