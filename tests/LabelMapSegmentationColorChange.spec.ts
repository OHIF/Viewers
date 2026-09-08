import {
  expect,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
  checkForViewportScreenshot,
  screenShotPaths,
} from './utils';

const NEW_LABELMAP_SEGMENT_HEX = '#FF5722';
const NEW_LABELMAP_SEGMENT_HEX_CSS_RGB = 'rgb(255, 87, 34)';

// Default color of segment 0 in the labelmap SEG study.
const LABELMAP_SEGMENT_0_DEFAULT_HEX = '#9D6CA2';
const LABELMAP_SEGMENT_0_DEFAULT_CSS_RGB = 'rgb(157, 108, 162)';

const STUDY_UID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudy(page, STUDY_UID, 'segmentation', 2000);

  await leftPanelPageObject.loadSeriesByModality('SEG');
  await waitForViewportsRendered(page);

  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
});

test('opens the color edit popup when "Change Color" is clicked', async ({
  rightPanelPageObject,
  DOMOverlayPageObject,
}) => {
  const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
  await segment.actions.openChangeColor();

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeVisible();
  await expect(DOMOverlayPageObject.dialog.title).toHaveText('Segment Color');
  await expect(DOMOverlayPageObject.dialog.colorPicker.saveButton).toBeVisible();
  await expect(DOMOverlayPageObject.dialog.colorPicker.cancelButton).toBeVisible();

  await expect(DOMOverlayPageObject.dialog.colorPicker.hexInput).toHaveValue(
    LABELMAP_SEGMENT_0_DEFAULT_HEX
  );
});

test('changes the labelmap segment color when the user saves', async ({
  page,
  rightPanelPageObject,
  DOMOverlayPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.getById('default');

  await rightPanelPageObject.labelMapSegmentationPanel.segmentsVisibilityToggle.click();
  const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
  await segment.toggleVisibility();
  await segment.click();

  await expect(segment.rowDataColorHex).toHaveCSS(
    'background-color',
    LABELMAP_SEGMENT_0_DEFAULT_CSS_RGB
  );

  await checkForViewportScreenshot({
    page,
    viewport,
    screenshotPath: screenShotPaths.labelMapSegmentationColorChange.colorBeforeChange,
  });

  await segment.actions.openChangeColor();
  await DOMOverlayPageObject.dialog.colorPicker.fillHex(NEW_LABELMAP_SEGMENT_HEX);

  const colorChangeCycle = waitForViewportRenderCycle(page);
  await DOMOverlayPageObject.dialog.colorPicker.save();
  await colorChangeCycle;

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeHidden();
  await expect(segment.rowDataColorHex).toHaveCSS(
    'background-color',
    NEW_LABELMAP_SEGMENT_HEX_CSS_RGB
  );

  await checkForViewportScreenshot({
    page,
    viewport,
    screenshotPath: screenShotPaths.labelMapSegmentationColorChange.colorAfterChange,
  });
});

test('does not change the labelmap segment color when the user cancels', async ({
  page,
  rightPanelPageObject,
  DOMOverlayPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.getById('default');

  await rightPanelPageObject.labelMapSegmentationPanel.segmentsVisibilityToggle.click();
  const segment = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
  await segment.toggleVisibility();
  await segment.click();

  await expect(viewport.pane.getByText('Loading...', { exact: true })).toBeHidden();
  await waitForViewportsRendered(page);

  await expect(segment.rowDataColorHex).toHaveCSS(
    'background-color',
    LABELMAP_SEGMENT_0_DEFAULT_CSS_RGB
  );

  await checkForViewportScreenshot({
    page,
    viewport,
    screenshotPath: screenShotPaths.labelMapSegmentationColorChange.colorBeforeCancel,
  });

  await segment.actions.cancelChangeColor(NEW_LABELMAP_SEGMENT_HEX);

  await expect(DOMOverlayPageObject.dialog.colorPicker.locator).toBeHidden();
  await expect(segment.rowDataColorHex).toHaveCSS(
    'background-color',
    LABELMAP_SEGMENT_0_DEFAULT_CSS_RGB
  );

  await checkForViewportScreenshot({
    page,
    viewport,
    screenshotPath: screenShotPaths.labelMapSegmentationColorChange.colorAfterCancel,
  });
});
