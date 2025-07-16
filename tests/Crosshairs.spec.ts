import { Page, test } from 'playwright-test-coverage';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  initializeMousePositionTracker,
  getMousePosition,
} from './utils/index.js';

const rotateCrosshairs = async (page: Page, id: string, lineNumber: number) => {
  const locator = await page.locator(id).locator('line').nth(lineNumber);
  await locator.click({ force: true });
  await locator.hover({ force: true });
  const circleLocator = await page.locator(id).locator('circle').nth(1);
  await circleLocator.hover({ force: true });
  await page.mouse.down();
  const position = await getMousePosition(page);
  await page.mouse.move(position.x, position.y + 100);
  await page.mouse.up();
};

const increaseSlabThickness = async (page: Page, id: string, lineNumber: number, axis: string) => {
  const locator = await page.locator(id).locator('line').nth(lineNumber);
  await locator.click({ force: true });
  await locator.hover({ force: true });
  const circleLocator = await page.locator(id).locator('rect').first();
  await circleLocator.hover({ force: true });
  await page.mouse.down();
  const position = await getMousePosition(page);
  switch (axis) {
    case 'x':
      await page.mouse.move(position.x + 100, position.y);
      break;
    case 'y':
      await page.mouse.move(position.x, position.y + 100);
      break;
  }
  await page.mouse.up();
};

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await initializeMousePositionTracker(page);
});

test.describe('Crosshairs Test', async () => {
  test('should render the crosshairs correctly.', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await page.getByTestId('Crosshairs').click();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsRendered);
  });

  test('should allow the user to rotate the crosshairs', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await page.getByTestId('Crosshairs').click();

    await rotateCrosshairs(page, '#svg-layer-mpr-axial', 3);
    await rotateCrosshairs(page, '#svg-layer-mpr-sagittal', 0);
    await rotateCrosshairs(page, '#svg-layer-mpr-coronal', 0);

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsRotated);
  });

  test('should allow the user to adjust the slab thickness', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await page.getByTestId('Crosshairs').click();

    await increaseSlabThickness(page, '#svg-layer-mpr-axial', 0, 'x');
    await increaseSlabThickness(page, '#svg-layer-mpr-sagittal', 2, 'x');
    await increaseSlabThickness(page, '#svg-layer-mpr-coronal', 0, 'y');

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsSlabThickness);
  });

  test('should reset the crosshairs to the initial position when reset is clicked', async ({
    page,
  }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await page.getByTestId('Crosshairs').click();

    await rotateCrosshairs(page, '#svg-layer-mpr-axial', 3);
    await rotateCrosshairs(page, '#svg-layer-mpr-sagittal', 0);
    await rotateCrosshairs(page, '#svg-layer-mpr-coronal', 0);

    await page.getByTestId('MoreTools-split-button-primary').click();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsResetToolbar);
  });

  test('should reset the crosshairs when a new displayset is loaded', async ({ page }) => {
    await page.getByTestId('Layout').click();
    await page.locator('div').filter({ hasText: /^MPR$/ }).first().click();
    await page.getByTestId('Crosshairs').click();

    await rotateCrosshairs(page, '#svg-layer-mpr-axial', 0);
    await rotateCrosshairs(page, '#svg-layer-mpr-sagittal', 0);
    await rotateCrosshairs(page, '#svg-layer-mpr-coronal', 3);

    await page.getByTestId('study-browser-thumbnail').nth(1).dblclick();

    await checkForScreenshot(page, page, screenShotPaths.crosshairs.crosshairsNewDisplayset);
  });
});
