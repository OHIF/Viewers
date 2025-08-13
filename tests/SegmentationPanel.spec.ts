import { test, expect } from 'playwright-test-coverage';
import { visitStudy } from './utils';

test.beforeEach(async ({ page }) => {
  // Using same one as JumpToMeasurementMPR.spec.ts
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.256467663913010332776401703474716742458';
  const mode = 'segmentation'; // To also test add/remove
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test('checks basic add, rename, delete segments from panel', async ({ page }) => {
  // Segmentation Panel should already be open
  const segmentationPanel = page.getByTestId('panelSegmentationWithTools-btn');
  await expect(segmentationPanel).toBeVisible();

  // Add segmentation
  const addSegmentationBtn = page.getByTestId('addSegmentation');
  await addSegmentationBtn.click();

  // Expect new segmentation and blank segment named "Segment 1"
  await expect(page.getByTestId('data-row')).toHaveCount(1);
  await expect(page.getByTestId('data-row')).toContainText('Segment 1');

  // Rename
  const segment1Dropdown = page
    .getByTestId('data-row')
    .first()
    .getByRole('button', { name: 'Actions' });
  await segment1Dropdown.click();

  const renameButton = page.getByRole('menuitem', { name: 'Rename' });
  await expect(renameButton).toBeVisible();
  await renameButton.click();

  const renameDialog = page.getByRole('dialog', { name: 'Edit Segment Label' });
  await expect(renameDialog).toBeVisible();

  const renameInput = page.getByRole('textbox', { name: 'Enter new label' });
  await renameInput.fill('Segment One');

  await page.getByTestId('input-dialog-save-button').click();

  await expect(page.getByTestId('data-row')).toContainText('Segment One');
  await expect(page.getByTestId('data-row')).not.toContainText('Segment 1');

  // Delete
  await segment1Dropdown.click();
  const deleteButton = page.getByRole('menuitem', { name: 'Delete' });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await expect(page.getByTestId('data-row')).toHaveCount(0);
});

test('checks saved segmentations loads and jumps to slices', async ({ page }) => {
  const viewportInfoBottomRight = page.getByTestId('viewport-overlay-bottom-right');

  // Image loads on slice 1, confirm on slice 1
  await expect(viewportInfoBottomRight).toContainText('1/', { timeout: 10000 });

  // Add Segmentations
  const segmentationsThumbnail = page
    .getByTestId('study-browser-thumbnail-no-image')
    .getByRole('button', { name: 'Segmentation' });
  await segmentationsThumbnail.dblclick();

  await page.waitForTimeout(3000);

  // Confirm open segmentation
  const viewportNotification = page.getByTestId('viewport-notification');
  await expect(viewportNotification).toBeVisible();
  await page.getByTestId('yes-hydrate-btn').click();

  // Segmentation Panel should already be open
  const segmentationPanel = page.getByTestId('panelSegmentationWithTools-btn');
  await expect(segmentationPanel).toBeVisible();

  // Confirm spleen jumps to slice 17
  // First iteration repeat to account for segmentation loading delays
  const spleenRow = page.getByTestId('data-row').filter({ hasText: 'Spleen' });
  await expect(async () => {
    await spleenRow.click();
    await expect(viewportInfoBottomRight).toContainText('17/');
  }).toPass({
    timeout: 10000,
  });

  // Esophagus - 5
  const esophagusRow = page.getByTestId('data-row').filter({ hasText: 'Esophagus' });
  await esophagusRow.click();
  await expect(viewportInfoBottomRight).toContainText('5/');

  // Pancreas - 22
  const pancreasRow = page.getByTestId('data-row').filter({ hasText: 'Pancreas' });
  await pancreasRow.click();
  await expect(viewportInfoBottomRight).toContainText('22/');
});
