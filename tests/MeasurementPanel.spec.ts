import { test, expect } from 'playwright-test-coverage';
import { visitStudy, addLengthMeasurement, scrollVolumeViewport } from './utils';

test.beforeEach(async ({ page }) => {
  // Using same one as JumpToMeasurementMPR.spec.ts
  const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('checks if Measurements right panel can be hidden/displayed', async ({ page }) => {
  const measurementsPanel = page.getByTestId('trackedMeasurements-panel').last();
  const rightCollapseBtn = page.getByTestId('side-panel-header-right');

  // No data-cy exists in this panel, using Segmentation header button
  const segmentationPanel = page.getByRole('button', { name: 'Segmentations' });
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');
  const segmentationsBtn = page.getByTestId('panelSegmentation-btn');

  // Assert the measurements panel and segmentation panel is hidden initially
  await expect(measurementsPanel).toBeHidden();
  await expect(segmentationPanel).toBeHidden();

  // Click the collapse button to show the panel container
  await rightCollapseBtn.click({ force: true });

  // The segmentation panel should now be visible by default
  await expect(segmentationPanel).toBeVisible();

  // Switch to the measurements tab
  await measurementsBtn.click();

  // Assert the measurements panel is visible, and segmentation invisible
  await expect(measurementsPanel).toBeVisible();
  await expect(segmentationPanel).toBeHidden();

  // Switch back to segmentations panel
  await segmentationsBtn.click();

  // Assert the segmentations panel is now visible, measurements panel invisible
  await expect(segmentationPanel).toBeVisible();
  await expect(measurementsPanel).toBeHidden();

  // Click the collapse button to hide the panel
  await rightCollapseBtn.click();

  // Assert the measurements and segmentation panel is now hidden
  await expect(measurementsPanel).toBeHidden();
  await expect(segmentationPanel).toBeHidden();
});

test('checks if measurement item can be relabeled under Measurements panel', async ({ page }) => {
  const relabelText = 'Relabel 12345';
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');

  // Add measurement
  await addLengthMeasurement(page);

  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  // Open measurement panel confirm default empty
  await measurementsBtn.click();
  const measurementRow = page.getByTestId('data-row').first();
  await expect(measurementRow).toContainText('(empty)');

  // Expand and click rename
  const actionsButton = measurementRow.getByRole('button', { name: 'Actions' });
  await actionsButton.click();

  const renameButton = page.getByRole('menuitem', { name: 'Rename' });
  await renameButton.click();

  // Interact with dialog
  const renameDialog = page.getByRole('dialog', { name: 'Edit Measurement Label' });
  const renameInput = renameDialog.getByPlaceholder('Enter new label');
  const saveButton = renameDialog.getByRole('button', { name: 'Save' });

  await expect(renameDialog).toBeVisible();
  await expect(renameInput).toBeVisible();
  await expect(saveButton).toBeEnabled();

  await renameInput.fill(relabelText);
  await saveButton.click();

  // Check dialog closed and renamed
  await expect(renameDialog).toBeHidden();
  await expect(measurementRow).toContainText(relabelText);
});

test('checks if measurement item can be relabeled through the context menu on the viewport', async ({
  page,
}) => {
  const relabelText = 'Relabel 12345';
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');

  // Add measurement
  await addLengthMeasurement(page);

  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  // Open measurement panel confirm default empty
  await measurementsBtn.click();
  const measurementRow = page.getByTestId('data-row').first();
  await expect(measurementRow).toContainText('(empty)');

  // Right click and click rename
  await page.waitForTimeout(200); // small delay for context menu
  const measurementAnnotation = page.locator('g[data-annotation-uid]').first();
  await measurementAnnotation.click({ button: 'right', force: true });
  await page.waitForTimeout(200); // small delay for context menu

  const addLabelButton = page.getByTestId('context-menu-item').filter({ hasText: 'Add Label' });
  await expect(addLabelButton).toBeVisible();
  await addLabelButton.click();

  // Interact with dialog
  const renameDialog = page.getByRole('dialog', { name: 'Edit Measurement Label' });
  const renameInput = renameDialog.getByPlaceholder('Enter new label');
  const saveButton = renameDialog.getByRole('button', { name: 'Save' });

  await expect(renameDialog).toBeVisible();
  await expect(renameInput).toBeVisible();
  await expect(saveButton).toBeEnabled();

  await renameInput.fill(relabelText);
  await saveButton.click();

  // Check dialog closed and renamed
  await expect(renameDialog).toBeHidden();
  await expect(measurementRow).toContainText(relabelText);
});

test('checks if image would jump when clicked on a measurement item', async ({ page }) => {
  const viewportInfoBottomRight = page.getByTestId('viewport-overlay-bottom-right');

  // Image loads on slice 1, confirm on slice 1 then add measurement
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });
  await addLengthMeasurement(page);

  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  // Change to slice 2
  await scrollVolumeViewport(page, 'default', 1);

  // Check currently on slice 2 then add measurement
  await expect(viewportInfoBottomRight).toContainText('2/', { timeout: 15000 });
  await addLengthMeasurement(page);

  // Open measurement panel and click first measurement
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');
  await measurementsBtn.click();
  const measurementRow = page.getByTestId('data-row').first();
  await measurementRow.click();

  // Confirm jumped to slice 1
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });
  await expect(viewportInfoBottomRight).not.toContainText('2/');
});

test('checks if measurement item can be deleted under Measurements panel', async ({ page }) => {
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');

  // Add 3 measurements
  await addLengthMeasurement(page);

  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();
  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  await addLengthMeasurement(page, { firstClick: [170, 100], secondClick: [150, 170] });
  await addLengthMeasurement(page, { firstClick: [190, 100], secondClick: [170, 170] });

  // Open measurement panel, confirm 3 measurements
  await measurementsBtn.click();
  await expect(page.getByTestId('data-row')).toHaveCount(3);

  // Delete from measurement
  const measurementRow = page.getByTestId('data-row').first();
  const actionsButton = measurementRow.getByRole('button', { name: 'Actions' });
  await actionsButton.click();

  const menuDeleteButton = page.getByRole('menuitem', { name: 'Delete' });
  await menuDeleteButton.click();

  // Confirm one measurement is gone
  await expect(page.getByTestId('data-row')).toHaveCount(2);

  // Delete all measurements via main Measurement Panel delete button and untrack
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  deleteButton.click();

  // Interact with dialog
  const untrackDialog = page.getByRole('dialog', { name: 'Untrack Study' });
  const untrackButton = untrackDialog.getByRole('button', { name: 'Untrack' });

  await expect(untrackDialog).toBeVisible();
  await expect(untrackButton).toBeEnabled();

  await untrackButton.click();

  // Check dialog closed and measurements gone
  await expect(untrackDialog).toBeHidden();
  await expect(page.getByTestId('data-row')).toHaveCount(0);

  const measurementsPanel = page.getByTestId('trackedMeasurements-panel').last();
  await expect(measurementsPanel).toContainText('No tracked measurements');
});

test('checks if measurement item can be deleted through the context menu on the viewport', async ({
  page,
}) => {
  const measurementsBtn = page.getByTestId('trackedMeasurements-btn');

  // Add measurement
  await addLengthMeasurement(page);

  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();

  await page.getByTestId('prompt-begin-tracking-yes-btn').click();

  // Right click and click rename
  await page.waitForTimeout(200); // small delay for context menu
  const measurementAnnotation = page.locator('g[data-annotation-uid]').first();
  await measurementAnnotation.click({ button: 'right', force: true });
  await page.waitForTimeout(200); // small delay for context menu

  const deleteButton = page.getByTestId('context-menu-item').filter({ hasText: 'Delete' });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // Open measurement panel and confirm measurement is gone
  await measurementsBtn.click();
  await expect(measurementAnnotation).toBeHidden();
  await expect(page.getByTestId('data-row')).toHaveCount(0);
});
