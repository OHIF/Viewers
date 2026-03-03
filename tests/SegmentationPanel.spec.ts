import { expect, test, visitStudy } from './utils';

const nonNumericError = 'Cannot type text into input[type=number]';

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

test.describe('Segmentation panel config input validation for labelmap', () => {
  test.beforeEach(async ({ rightPanelPageObject }) => {
    await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

    await rightPanelPageObject.labelMapSegmentationPanel.config.toggle.click();
  });

  test.describe('opacity', () => {
    test('should accept valid values', async ({ rightPanelPageObject }) => {
      const { opacity } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacity.fill('0');
      await expect(opacity.input).toHaveValue('0');

      await opacity.fill('0.5');
      await expect(opacity.input).toHaveValue('0.5');

      await opacity.fill('1');
      await expect(opacity.input).toHaveValue('1');
    });

    test('should clamp opacity to max (1) when a value above the maximum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { opacity } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacity.fill('500');
      await expect(opacity.input).toHaveValue('1');
    });

    test('should clamp opacity to min (0) when a value below the minimum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { opacity } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacity.fill('-1');
      await expect(opacity.input).toHaveValue('0');
    });

    test('should reject non-numeric opacity input', async ({ rightPanelPageObject }) => {
      const { opacity } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await expect(opacity.fill('abc')).rejects.toThrow(nonNumericError);
    });
  });

  test.describe('border', () => {
    test('should accept valid values', async ({ rightPanelPageObject }) => {
      const { border } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await border.fill('0');
      await expect(border.input).toHaveValue('0');

      await border.fill('5');
      await expect(border.input).toHaveValue('5');

      await border.fill('10');
      await expect(border.input).toHaveValue('10');
    });

    test('should clamp border to max (10) when a value above the maximum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { border } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await border.fill('500');
      await expect(border.input).toHaveValue('10');
    });

    test('should clamp border to min (0) when a value below the minimum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { border } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await border.fill('-1');
      await expect(border.input).toHaveValue('0');
    });

    test('should reject non-numeric border input', async ({ rightPanelPageObject }) => {
      const { border } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await expect(border.fill('abc')).rejects.toThrow(nonNumericError);
    });
  });

  test.describe('opacity inactive', () => {
    test('should accept valid values', async ({ rightPanelPageObject }) => {
      const { opacityInactive } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacityInactive.fill('0');
      await expect(opacityInactive.input).toHaveValue('0');

      await opacityInactive.fill('0.5');
      await expect(opacityInactive.input).toHaveValue('0.5');

      await opacityInactive.fill('1');
      await expect(opacityInactive.input).toHaveValue('1');
    });

    test('should clamp opacity inactive to max (1) when a value above the maximum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { opacityInactive } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacityInactive.fill('500');
      await expect(opacityInactive.input).toHaveValue('1');
    });

    test('should clamp opacity inactive to min (0) when a value below the minimum is entered', async ({
      rightPanelPageObject,
    }) => {
      const { opacityInactive } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await opacityInactive.fill('-1');
      await expect(opacityInactive.input).toHaveValue('0');
    });

    test('should reject non-numeric opacity inactive input', async ({ rightPanelPageObject }) => {
      const { opacityInactive } = rightPanelPageObject.labelMapSegmentationPanel.config;

      await expect(opacityInactive.fill('abc')).rejects.toThrow(nonNumericError);
    });
  });
});
