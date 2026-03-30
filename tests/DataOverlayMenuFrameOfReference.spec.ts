import { test, visitStudy, expect } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.12201.1091.126683095609223531686845324113579088978';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('should only show segmentations matching the background Frame of Reference', async ({
  viewportPageObject,
}) => {
  const segmentationLabelsFOR1 = ['Segmentation FOR1SEG', 'FoR 1 RTstructRTSTRUCT'];
  const segmentationLabelsFOR2 = ['Segmentation FOR2SEG', 'FoR 2 RTstructRTSTRUCT'];

  const dataOverlay = (await viewportPageObject.getNth(0)).overlayMenu.dataOverlay;

  await dataOverlay.toggle();
  await dataOverlay.openAddSegmentationDropdown();

  const segmentationLabels = await dataOverlay.getDropdownOptionLabels();
  expect(segmentationLabels.sort()).toEqual([...segmentationLabelsFOR1].sort());
  await dataOverlay.toggle();
  await expect(dataOverlay.menu).not.toBeVisible();

  await dataOverlay.toggle();
  await dataOverlay.changeBackgroundDisplaySet('CT Std (FoR 2)-CT');
  await dataOverlay.openAddSegmentationDropdown();

  const segmentationLabelsAfterBgChange = await dataOverlay.getDropdownOptionLabels();
  expect(segmentationLabelsAfterBgChange).not.toEqual(segmentationLabelsFOR1);
  expect(segmentationLabelsAfterBgChange.sort()).toEqual([...segmentationLabelsFOR2].sort());
});

test('should only sync segmentations to viewports with same Frame of Reference', async ({
  viewportPageObject,
}) => {
  const segmentationFOR1Label = 'Segmentation FOR1';

  const viewportA = await viewportPageObject.getNth(0);
  const viewportB = await viewportPageObject.getNth(1);
  const viewportC = await viewportPageObject.getNth(2);

  const dataOverlayA = viewportA.overlayMenu.dataOverlay;
  const dataOverlayB = viewportB.overlayMenu.dataOverlay;
  const dataOverlayC = viewportC.overlayMenu.dataOverlay;

  // In FOR1 viewport A: add a segmentation FOR1 overlay
  await viewportA.pane.hover();
  await dataOverlayA.toggle();
  await dataOverlayA.addSegmentation(segmentationFOR1Label);
  await expect(dataOverlayA.getOverlaySegmentationRow(segmentationFOR1Label)).toBeVisible();
  await dataOverlayA.toggle();
  await expect(dataOverlayA.menu).not.toBeVisible();

  // In another FOR1 viewport B: segmentation FOR1 should be visible (synced)
  await viewportB.pane.hover();
  await dataOverlayB.toggle();
  const activeSegmentationViewportB = dataOverlayB.getOverlaySegmentationRow(segmentationFOR1Label);
  await expect(activeSegmentationViewportB).toBeVisible();
  await expect(activeSegmentationViewportB).toHaveText(segmentationFOR1Label.toUpperCase());
  await dataOverlayB.toggle();
  await expect(dataOverlayB.menu).not.toBeVisible();

  // In FOR2 viewport C: segmentation FOR1 should NOT be visible
  await viewportC.pane.hover();
  await dataOverlayC.toggle();
  await expect(dataOverlayC.getOverlaySegmentationRow(segmentationFOR1Label)).not.toBeVisible();
  await dataOverlayC.toggle();
  await expect(dataOverlayC.menu).not.toBeVisible();
});

test('should preserve segmentation order after menu close and reopen', async ({
  viewportPageObject,
}) => {
  const segmentation1Label = 'Segmentation FOR1';
  const segmentation2Label = 'FoR 1 RTstruct';

  const dataOverlay = (await viewportPageObject.getNth(0)).overlayMenu.dataOverlay;

  await dataOverlay.toggle();
  await dataOverlay.addSegmentation(segmentation1Label);
  await expect(dataOverlay.getOverlaySegmentationRow(segmentation1Label)).toBeVisible();

  await dataOverlay.addSegmentation(segmentation2Label);
  await expect(dataOverlay.getOverlaySegmentationRow(segmentation2Label)).toBeVisible();

  await dataOverlay.toggle();
  await expect(dataOverlay.menu).not.toBeVisible();

  // Reopen menu and verify segmentation order is preserved
  await dataOverlay.toggle();
  await expect(dataOverlay.overlaySegmentationRows).toHaveCount(2);
  await expect(dataOverlay.overlaySegmentationRows.nth(0)).toHaveText(
    segmentation1Label.toUpperCase()
  );
  await expect(dataOverlay.overlaySegmentationRows.nth(1)).toHaveText(
    segmentation2Label.toUpperCase()
  );
});
