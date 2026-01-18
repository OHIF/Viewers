import { expect, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  // Using same one as JumpToMeasurementMPR.spec.ts
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation'; // To also test add/remove
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('checks basic add, rename, delete segments from panel', async ({ rightPanelPageObject }) => {
  // Segmentation Panel should already be open
  const segmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.menuButton;
  await expect(segmentationPanel).toBeVisible();

  // Switch to labelmap tab.
  segmentationPanel.click();

  // Add segmentation
  await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

  // Expect new segmentation and blank segment named "Segment 1"
  const segment1 = rightPanelPageObject.labelMapSegmentationPanel.panel.nthSegment(0);
  expect(await rightPanelPageObject.labelMapSegmentationPanel.panel.getSegmentCount()).toBe(1);
  await expect(segment1.locator).toContainText('Segment 1');

  // Rename
  await segment1.actions.rename('Segment One');

  await expect(segment1.locator).toContainText('Segment One');
  await expect(segment1.locator).not.toContainText('Segment 1');

  // Delete
  await segment1.actions.delete();

  expect(await rightPanelPageObject.labelMapSegmentationPanel.panel.getSegmentCount()).toBe(0);
});

test('checks saved segmentations loads and jumps to slices', async ({
  page,
  DOMOverlayPageObject,
  leftPanelPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewportInfoBottomRight = viewportPageObject.active.overlayText.bottomRight;
  // Image loads on slice 1, confirm on slice 1
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });

  // Add Segmentations
  await leftPanelPageObject.loadSeriesByModality('SEG');

  await page.waitForTimeout(3000);

  // Confirm open segmentation
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();

  // Segmentation Panel should already be open
  const segmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.menuButton;
  await expect(segmentationPanel).toBeVisible();

  // Confirm spleen jumps to slice 17
  // First iteration repeat to account for segmentation loading delays
  await expect(async () => {
    await rightPanelPageObject.labelMapSegmentationPanel.panel.segmentByText('Spleen').click();
    await expect(viewportInfoBottomRight).toContainText('17/');
  }).toPass({
    timeout: 10000,
  });

  // Esophagus - 5
  await rightPanelPageObject.labelMapSegmentationPanel.panel.segmentByText('Esophagus').click();
  await expect(viewportInfoBottomRight).toContainText('5/');

  // Pancreas - 22
  await rightPanelPageObject.labelMapSegmentationPanel.panel.segmentByText('Pancreas').click();
  await expect(viewportInfoBottomRight).toContainText('22/');
});
