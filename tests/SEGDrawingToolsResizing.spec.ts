import { test, expect } from 'playwright-test-coverage';
import { Page } from '@playwright/test';

import { visitStudy, checkForScreenshot, screenShotPaths } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('panelSegmentationWithToolsLabelMap-btn').click();
  await press({ page, key: 'ArrowDown', nTimes: 64 });
  await page.getByTestId('addSegmentation').click();
});

async function performDrawingToolInteraction(page: Page, toolName: string) {
  await expect(page.getByTestId(`${toolName}-radius`).locator('input')).toHaveValue('25');
  await page.getByTestId('viewport-grid').click({ position: { x: 275, y: 300 } });

  await page.waitForTimeout(500);
  await press({ page, key: '[', nTimes: 2 });
  await expect(page.getByTestId(`${toolName}-radius`).locator('input')).toHaveValue('19');
  await page.getByTestId('viewport-grid').click({ position: { x: 500, y: 300 } });

  await page.waitForTimeout(500);

  await press({ page, key: ']', nTimes: 5 });
  await expect(page.getByTestId(`${toolName}-radius`).locator('input')).toHaveValue('34');
  await page.getByTestId('viewport-grid').click({ position: { x: 275, y: 500 } });

  await page.waitForTimeout(500);

  await page.getByTestId(`${toolName}-radius`).locator('input').fill('42');
  await page.getByTestId('viewport-grid').click({ position: { x: 500, y: 500 } });

  await page.waitForTimeout(500);
}

test('should resize segmentation brush tool', async ({ page }) => {
  await page.getByTestId('Brush-btn').click();

  await performDrawingToolInteraction(page, 'brush');

  await checkForScreenshot(page, page, screenShotPaths.segDrawingToolsResizing.brushTool);
});

test('should resize segmentation eraser tool', async ({ page }) => {
  await page.getByTestId('Brush-btn').click();

  await page.getByTestId('brush-radius').locator('input').fill('99.5');
  await page.getByTestId('viewport-grid').click({ position: { x: 400, y: 400 } });

  await page.waitForTimeout(500);

  await page.getByTestId('Eraser-btn').click();
  await page.getByTestId(`eraser-radius`).locator('input').fill('25');

  await page.waitForTimeout(500);

  await performDrawingToolInteraction(page, 'eraser');

  await checkForScreenshot(page, page, screenShotPaths.segDrawingToolsResizing.eraserTool);
});

test('should resize segmentation threshold tool', async ({ page }) => {
  await page.getByTestId('Threshold-btn').click();

  await performDrawingToolInteraction(page, 'threshold');
});
