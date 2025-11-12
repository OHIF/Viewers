import { checkForScreenshot, screenShotPaths, test, visitStudy } from './utils';

test('should display the dicom tag browser', async ({ page, mainToolbarPageObject }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await mainToolbarPageObject.moreTools.tagBrowser.click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.dicomTagBrowser.dicomTagBrowserDisplayedCorrectly
  );
});

test('should render the scroll bar with the correct look-and-feel', async ({
  page,
  mainToolbarPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await mainToolbarPageObject.moreTools.tagBrowser.click();
  await checkForScreenshot({
    page,
    normalizedClip: { x: 0.77, y: 0.25, width: 0.03, height: 0.75 },
    screenshotPath: screenShotPaths.dicomTagBrowser.scrollBarRenderedProperly,
  });
});
