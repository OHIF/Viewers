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

test('should open DICOM Tag Browser from empty viewport and show default series', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
  DOMOverlayPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095258.1';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  // Switch to 3x3 layout
  await mainToolbarPageObject.layoutSelection.click();
  await page.getByTestId('Layout-2-2').click();

  await viewportPageObject.getNth(6).pane.click();

  await mainToolbarPageObject.moreTools.tagBrowser.click();

  const dicomTagBrowser = DOMOverlayPageObject.dialog.dicomTagBrowser;
  await dicomTagBrowser.waitVisible();

  const seriesSelect = dicomTagBrowser.seriesSelect;
  const optionText = await seriesSelect.getOptionText(0);

  await expect(seriesSelect.value).toContainText(optionText);
});

test('should open DICOM Tag Browser with active viewport series when viewport has display set', async ({
  page,
  mainToolbarPageObject,
  viewportPageObject,
  DOMOverlayPageObject,
}) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095258.1';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await mainToolbarPageObject.layoutSelection.click();
  await page.getByTestId('Layout-2-2').click();

  await viewportPageObject.getNth(2).pane.click();

  await mainToolbarPageObject.moreTools.tagBrowser.click();

  const dicomTagBrowser = DOMOverlayPageObject.dialog.dicomTagBrowser;
  await dicomTagBrowser.waitVisible();

  const seriesSelect = dicomTagBrowser.seriesSelect;
  const optionText = await seriesSelect.getOptionText(2);

  await expect(seriesSelect.value).toContainText(optionText);
});
