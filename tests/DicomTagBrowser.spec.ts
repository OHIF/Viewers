import { checkForScreenshot, screenShotPaths, test, visitStudy, expect } from './utils';
import { assertBoundingBoxIsContainedWithin } from './utils/assertions';

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

test('should display the long series name properly within the series select button', async ({
  page,
  mainToolbarPageObject,
  DOMOverlayPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.5099.8010.217836670708542506360829799868';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await mainToolbarPageObject.moreTools.tagBrowser.click();
  const dicomTagBrowser = DOMOverlayPageObject.dialog.dicomTagBrowser;

  await dicomTagBrowser.waitVisible();

  const seriesSelect = dicomTagBrowser.seriesSelect;

  const selectedOptionText = await seriesSelect.selectOption(6);

  await expect(seriesSelect.value).toContainText(selectedOptionText);

  const triggerBox = await seriesSelect.trigger.boundingBox();
  const textBox = await seriesSelect.value.boundingBox();

  await assertBoundingBoxIsContainedWithin({
    innerBox: textBox,
    outerBox: triggerBox,
    innerBoxLabel: 'text',
    outerBoxLabel: 'trigger',
  });
});
