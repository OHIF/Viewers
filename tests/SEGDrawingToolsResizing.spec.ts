import { Page } from '@playwright/test';

import { RightPanelPageObject, ViewportPageObject } from './pages';
import { checkForScreenshot, expect, screenShotPaths, test, visitStudy } from './utils';
import { press } from './utils/keyboardUtils';

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  const studyInstanceUID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await rightPanelPageObject.labelMapSegmentationPanel.addSegmentationButton.click();

  await page.waitForTimeout(500);
});

async function performDrawingToolInteraction(
  page: Page,
  toolName: string,
  rightPanelPageObject: RightPanelPageObject,
  viewportPageObject: ViewportPageObject
) {
  const brushRadiusInput = rightPanelPageObject.labelMapSegmentationPanel.tools[toolName].input;
  const circle = viewportPageObject.active.svg('circle').first();

  await expect(brushRadiusInput).toHaveValue('25');
  await viewportPageObject.active.clickAt([{ x: 275, y: 300 }]);
  let radius = parseFloat(await circle.getAttribute('r'));
  expect(radius).toBeGreaterThanOrEqual(65);
  expect(radius).toBeLessThanOrEqual(68);

  await page.waitForTimeout(500);
  await press({ page, key: '[', nTimes: 2 });
  await expect(brushRadiusInput).toHaveValue('19');
  await viewportPageObject.active.clickAt([{ x: 500, y: 300 }]);
  radius = parseFloat(await circle.getAttribute('r'));
  expect(radius).toBeGreaterThanOrEqual(49);
  expect(radius).toBeLessThanOrEqual(52);

  await page.waitForTimeout(500);

  await press({ page, key: ']', nTimes: 5 });
  await expect(brushRadiusInput).toHaveValue('34');
  await viewportPageObject.active.clickAt([{ x: 275, y: 500 }]);
  radius = parseFloat(await circle.getAttribute('r'));
  expect(radius).toBeGreaterThanOrEqual(87);
  expect(radius).toBeLessThanOrEqual(90);

  await page.waitForTimeout(500);

  await brushRadiusInput.fill('42');
  await viewportPageObject.active.clickAt([{ x: 500, y: 500 }]);
  radius = parseFloat(await circle.getAttribute('r'));
  expect(radius).toBeGreaterThanOrEqual(108);
  expect(radius).toBeLessThanOrEqual(111);

  await page.waitForTimeout(500);
}

test('should resize segmentation brush tool', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await page.getByTestId('Brush-btn').click();

  await performDrawingToolInteraction(page, 'brush', rightPanelPageObject, viewportPageObject);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.segDrawingToolsResizing.brushTool
  );
});

test('should resize segmentation eraser tool', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await page.getByTestId('Brush-btn').click();

  await page.getByTestId('brush-radius').locator('input').fill('99.5');
  await viewportPageObject.active.clickAt([{ x: 400, y: 400 }]);

  await page.waitForTimeout(500);

  await page.getByTestId('Eraser-btn').click();
  await page.getByTestId('eraser-radius').locator('input').fill('25');

  await page.waitForTimeout(500);

  await performDrawingToolInteraction(page, 'eraser', rightPanelPageObject, viewportPageObject);

  await checkForScreenshot(
    page,
    viewportPageObject.active.pane,
    screenShotPaths.segDrawingToolsResizing.eraserTool
  );
});

test('should resize segmentation threshold tool', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await page.getByTestId('Threshold-btn').click();

  await performDrawingToolInteraction(page, 'threshold', rightPanelPageObject, viewportPageObject);
});
