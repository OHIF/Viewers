import {
  checkForScreenshot,
  screenShotPaths,
  test,
  visitStudy,
  expect,
  waitForError,
} from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should display the bidirectional tool', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  viewportPageObject,
}) => {
  await mainToolbarPageObject.measurementTools.bidirectional.click();
  await viewportPageObject.active.clickAt([
    { x: 405, y: 277 },
    { x: 515, y: 339 },
  ]);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await checkForScreenshot(
    page,
    page,
    screenShotPaths.bidirectional.bidirectionalDisplayedCorrectly
  );
});

test.describe('Segment Bidirectional', () => {
  test.beforeEach(async ({ page }) => {
    const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
    const mode = 'segmentation';
    await visitStudy(page, studyInstanceUID, mode, 2000);
  });

  test('should not show an error when Segment Bidirectional is clicked without a segment being drawn', async ({
    page,
    rightPanelPageObject,
  }) => {
    await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

    const errorMessage = waitForError(page, 3000);

    await rightPanelPageObject.labelMapSegmentationPanel.segmentBidirectional.click();

    await expect(errorMessage).rejects.toThrow();
  });
});
