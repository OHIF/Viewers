import { test, visitStudy, expect } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.12201.1091.126683095609223531686845324113579088978';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should only show segmentations matching the background Frame of Reference', async ({
  page,
  viewportPageObject,
}) => {
  const viewportId = await viewportPageObject.getIdOfNth(0);
  const segmentationLabelsFOR1 = ['Segmentation FOR1SEG', 'FoR 1 RTstructRTSTRUCT'];
  const segmentationLabelsFOR2 = ['Segmentation FOR2SEG', 'FoR 2 RTstructRTSTRUCT'];

  const dataOverlay = viewportPageObject.getById(viewportId).overlayMenu.dataOverlay;

  await dataOverlay.toggle(viewportId);
  await dataOverlay.openAddSegmentationDropdown(viewportId);
  await page.waitForTimeout(2000);

  const segmentationLabels = await dataOverlay.getDropdownOptionLabels();
  expect(segmentationLabels.sort()).toEqual([...segmentationLabelsFOR1].sort());
  await dataOverlay.closeMenu(viewportId);

  await dataOverlay.toggle(viewportId);
  await dataOverlay.changeBackgroundDisplaySet('CT Std (FoR 2)-CT', viewportId);
  await dataOverlay.openAddSegmentationDropdown(viewportId);
  await page.waitForTimeout(2000);

  const segmentationLabelsAfterBgChange = await dataOverlay.getDropdownOptionLabels();
  expect(segmentationLabelsAfterBgChange).not.toEqual(segmentationLabelsFOR1);
  expect(segmentationLabelsAfterBgChange.sort()).toEqual([...segmentationLabelsFOR2].sort());
});

test('should only sync segmentations to viewports with same Frame of Reference', async ({
  page,
  viewportPageObject,
}) => {
  const FOR1ViewportIdA = await viewportPageObject.getIdOfNth(0);
  const FOR1ViewportIdB = await viewportPageObject.getIdOfNth(1);
  const FOR2ViewportIdC = await viewportPageObject.getIdOfNth(2);

  const segmentationFOR1Label = 'Segmentation FOR1';

  const dataOverlay = viewportPageObject.getById(FOR1ViewportIdA).overlayMenu.dataOverlay;

  // In FOR1 viewport A: add a segmentation FOR1 overlay
  await viewportPageObject.getById(FOR1ViewportIdA).pane.hover();
  await dataOverlay.toggle(FOR1ViewportIdA);
  await dataOverlay.addSegmentation(segmentationFOR1Label, FOR1ViewportIdA);
  await expect(dataOverlay.getOverlaySegmentationRow(segmentationFOR1Label)).toBeVisible();
  await dataOverlay.closeMenu(FOR1ViewportIdA);
  await page.waitForTimeout(2000);

  // In another FOR1 viewport B: segmentation FOR1 should be visible (synced)
  await viewportPageObject.getById(FOR1ViewportIdB).pane.hover();
  await dataOverlay.toggle(FOR1ViewportIdB);
  const activeSegmentationViewportB = dataOverlay.getOverlaySegmentationRow(segmentationFOR1Label);
  await expect(activeSegmentationViewportB).toBeVisible();
  await expect(activeSegmentationViewportB).toHaveText(segmentationFOR1Label.toUpperCase());
  await dataOverlay.closeMenu(FOR1ViewportIdB);

  // In FOR2 viewport: segmentation FOR1 should NOT be visible
  await viewportPageObject.getById(FOR2ViewportIdC).pane.hover();
  await dataOverlay.toggle(FOR2ViewportIdC);
  await expect(dataOverlay.getOverlaySegmentationRow(segmentationFOR1Label)).not.toBeVisible();
  await dataOverlay.closeMenu(FOR2ViewportIdC);
});
