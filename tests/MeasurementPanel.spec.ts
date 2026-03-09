import { addLengthMeasurement, expect, scrollVolumeViewport, test, visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  // Using same one as JumpToMeasurementMPR.spec.ts
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('checks if Measurements right panel can be hidden/displayed', async ({
  rightPanelPageObject,
}) => {
  const measurementsPanel = rightPanelPageObject.measurementsPanel.panel.locator;
  const segmentationPanel = rightPanelPageObject.labelMapSegmentationPanel.panel.locator;

  // Assert the measurements panel and segmentation panel is hidden initially
  await expect(measurementsPanel).toBeHidden();
  await expect(segmentationPanel).toBeHidden();

  // Click the collapse button to show the panel container
  await rightPanelPageObject.toggle();

  // The segmentation panel should now be visible by default
  await expect(segmentationPanel).toBeVisible();

  // Switch to the measurements tab
  await rightPanelPageObject.measurementsPanel.select();

  // Assert the measurements panel is visible, and segmentation invisible
  await expect(measurementsPanel).toBeVisible();
  await expect(segmentationPanel).toBeHidden();

  // Switch back to segmentations panel
  await rightPanelPageObject.noToolsSegmentationPanel.select();

  // Assert the segmentations panel is now visible, measurements panel invisible
  await expect(segmentationPanel).toBeVisible();
  await expect(measurementsPanel).toBeHidden();

  // Click the collapse button to hide the panel
  await rightPanelPageObject.toggle();

  // Assert the measurements and segmentation panel is now hidden
  await expect(measurementsPanel).toBeHidden();
  await expect(segmentationPanel).toBeHidden();
});

test('checks if measurement item can be relabeled under Measurements panel', async ({
  page,
  DOMOverlayPageObject,
  rightPanelPageObject,
}) => {
  const relabelText = 'Relabel 12345';
  // Add measurement
  await addLengthMeasurement(page);

  const viewportNotification = DOMOverlayPageObject.viewport.measurementTracking.locator;
  await expect(viewportNotification).toBeVisible();

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // Open measurement panel confirm default empty
  await rightPanelPageObject.measurementsPanel.select();
  const measurementRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).locator;
  await expect(measurementRow).toContainText('(empty)');

  // Expand and click rename
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).actions.rename(relabelText);

  // Check dialog closed and renamed
  await expect(DOMOverlayPageObject.dialog.input.locator).toBeHidden();
  await expect(measurementRow).toContainText(relabelText);
});

test('checks if measurement item can be relabeled through the context menu on the viewport', async ({
  page,
  DOMOverlayPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const relabelText = 'Relabel 12345';

  // Add measurement
  await addLengthMeasurement(page);

  const viewportNotification = DOMOverlayPageObject.viewport.measurementTracking.locator;
  await expect(viewportNotification).toBeVisible();

  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // Open measurement panel confirm default empty
  await rightPanelPageObject.measurementsPanel.select();
  const measurementRow = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).locator;
  await expect(measurementRow).toContainText('(empty)');

  // Right click and click rename
  await page.waitForTimeout(200); // small delay for context menu
  await viewportPageObject.active.nthAnnotation(0).contextMenu.open();
  await page.waitForTimeout(200); // small delay for context menu

  const addLabelButton = DOMOverlayPageObject.viewport.annotationContextMenu.addLabel;
  await expect(addLabelButton.locator).toBeVisible();
  await addLabelButton.click();

  // Interact with dialog
  await expect(DOMOverlayPageObject.dialog.title).toHaveText('Edit Measurement Label');
  await DOMOverlayPageObject.dialog.input.fillAndSave(relabelText);

  // Check dialog closed and renamed
  await expect(DOMOverlayPageObject.dialog.title).toBeHidden();
  await expect(measurementRow).toContainText(relabelText);
});

test('checks if image would jump when clicked on a measurement item', async ({
  page,
  DOMOverlayPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewportInfoBottomRight = viewportPageObject.active.overlayText.bottomRight;

  // Image loads on slice 1, confirm on slice 1 then add measurement
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });
  await addLengthMeasurement(page);

  await expect(DOMOverlayPageObject.viewport.measurementTracking.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // Change to slice 2
  await scrollVolumeViewport(page, 'default', 1);

  // Check currently on slice 2 then add measurement
  await expect(viewportInfoBottomRight).toContainText('2/', { timeout: 15000 });
  await addLengthMeasurement(page);

  // Open measurement panel and click first measurement
  await rightPanelPageObject.measurementsPanel.select();
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).click();

  // Confirm jumped to slice 1
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });
  await expect(viewportInfoBottomRight).not.toContainText('2/');
});

test('checks if measurement item can be deleted under Measurements panel', async ({
  page,
  DOMOverlayPageObject,
  rightPanelPageObject,
}) => {
  // Add 3 measurements
  await addLengthMeasurement(page);

  await expect(DOMOverlayPageObject.viewport.measurementTracking.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  await addLengthMeasurement(page, { firstClick: [170, 100], secondClick: [150, 170] });
  await addLengthMeasurement(page, { firstClick: [190, 100], secondClick: [170, 170] });

  // Open measurement panel, confirm 3 measurements
  await rightPanelPageObject.measurementsPanel.select();
  expect(await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()).toBe(3);

  // Delete from measurement
  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).actions.delete();
  await page.waitForTimeout(200);

  // Confirm one measurement is gone
  expect(await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()).toBe(2);

  // Delete all measurements via main Measurement Panel delete button and untrack
  await rightPanelPageObject.measurementsPanel.panel.deleteAll();

  // Interact with dialog
  await expect(DOMOverlayPageObject.dialog.title).toHaveText('Untrack Study');

  await expect(DOMOverlayPageObject.dialog.confirmation.confirm.button).toBeEnabled();

  await DOMOverlayPageObject.dialog.confirmation.confirm.click();

  // Check dialog closed and measurements gone
  await expect(DOMOverlayPageObject.dialog.title).toBeHidden();
  expect(await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()).toBe(0);

  const measurementsPanel = rightPanelPageObject.measurementsPanel.panel.locator;
  await expect(measurementsPanel).toContainText('No tracked measurements');
});

test('checks if measurement item can be deleted through the context menu on the viewport', async ({
  page,
  DOMOverlayPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Add measurement
  await addLengthMeasurement(page);
  await expect(DOMOverlayPageObject.viewport.measurementTracking.locator).toBeVisible();
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();

  // Right click and click rename
  await page.waitForTimeout(200); // small delay for context menu
  await viewportPageObject.active.nthAnnotation(0).contextMenu.open();
  await page.waitForTimeout(200); // small delay for context menu

  const deleteButton = DOMOverlayPageObject.viewport.annotationContextMenu.delete;
  await expect(deleteButton.locator).toBeVisible();
  await deleteButton.click();

  // Open measurement panel and confirm measurement is gone
  await rightPanelPageObject.measurementsPanel.select();
  await expect(viewportPageObject.active.nthAnnotation(0).locator).toBeHidden();
  expect(await rightPanelPageObject.measurementsPanel.panel.getMeasurementCount()).toBe(0);
});
