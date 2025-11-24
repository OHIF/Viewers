import { expect, test, visitStudy } from './utils';
import { simulateNormalizedDragOnElement } from './utils/simulateDragOnElement';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test('should not allow contours to be edited in basic viewer mode', async ({
  page,
  viewportPageObject,
}) => {
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  // Wait for the segmentation to be loaded.
  await page.waitForTimeout(5000);

  await page.getByTestId('yes-hydrate-btn').click();

  // Wait for the segmentation to hydrate.
  await page.waitForTimeout(5000);

  const svgPathLocatorPreEdit = viewportPageObject.getById('default').svg();

  expect(
    await svgPathLocatorPreEdit.count(),
    'Expected exactly 1 path element in the viewport'
  ).toBe(1);

  const expectedPathCommands = await svgPathLocatorPreEdit.getAttribute('d');

  // Try to drag one of the edges of the rectangular contour.
  await simulateNormalizedDragOnElement({
    locator: svgPathLocatorPreEdit,
    start: { x: 0.1, y: 0 },
    end: { x: 0.1, y: -0.2 },
  });

  const svgPathLocatorPostEdit = viewportPageObject.getById('default').svg();

  expect(
    await svgPathLocatorPostEdit.getAttribute('d'),
    'Expected the path commands to be the same as the pre-edit path commands'
  ).toBe(expectedPathCommands);
});

test('should not allow contours to be edited when panelSegmentation.disableEditing is true', async ({
  page,
  viewportPageObject,
}) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  // Wait for the segmentation to be loaded.
  await page.waitForTimeout(5000);

  // disable editing of segmentations via the customization service
  await page.evaluate(() => {
    window.services.customizationService.setGlobalCustomization(
      'panelSegmentation.disableEditing',
      {
        $set: true,
      }
    );
  });

  await page.getByTestId('yes-hydrate-btn').click();

  // Wait for the segmentation to hydrate.
  await page.waitForTimeout(5000);

  const svgPathLocatorPreEdit = viewportPageObject.getById('default').svg();

  expect(
    await svgPathLocatorPreEdit.count(),
    'Expected exactly 1 path element in the viewport'
  ).toBe(1);

  const expectedPathCommands = await svgPathLocatorPreEdit.getAttribute('d');

  // Try to drag one of the edges of the rectangular contour.
  await simulateNormalizedDragOnElement({
    locator: svgPathLocatorPreEdit,
    start: { x: 0.1, y: 0 },
    end: { x: 0.1, y: -0.2 },
  });

  const svgPathLocatorPostEdit = viewportPageObject.getById('default').svg();

  expect(
    await svgPathLocatorPostEdit.getAttribute('d'),
    'Expected the path commands to be the same as the pre-edit path commands'
  ).toBe(expectedPathCommands);
});

test('should allow contours to be edited when panelSegmentation.disableEditing is false', async ({
  page,
  viewportPageObject,
}) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await page.getByTestId('side-panel-header-right').click();
  await page.getByTestId('study-browser-thumbnail-no-image').dblclick();
  // Wait for the segmentation to be loaded.
  await page.waitForTimeout(5000);

  // disable editing of segmentations via the customization service
  await page.evaluate(() => {
    window.services.customizationService.setGlobalCustomization(
      'panelSegmentation.disableEditing',
      {
        $set: false,
      }
    );
  });

  await page.getByTestId('yes-hydrate-btn').click();

  // Wait for the segmentation to hydrate.
  await page.waitForTimeout(5000);

  const svgPathLocatorPreEdit = viewportPageObject.getById('default').svg('path');

  expect(
    await svgPathLocatorPreEdit.count(),
    'Expected exactly 1 path element in the viewport'
  ).toBe(1);

  const preEditPathCommands = await svgPathLocatorPreEdit.getAttribute('d');

  // Try to drag one of the edges of the rectangular contour.
  await simulateNormalizedDragOnElement({
    locator: svgPathLocatorPreEdit,
    start: { x: 0.1, y: 0 },
    end: { x: 0.1, y: -0.2 },
  });

  const svgPathLocatorPostEdit = viewportPageObject.getById('default').svg('path');

  expect(
    await svgPathLocatorPostEdit.getAttribute('d'),
    'Not expecting the path commands to be the same as the pre-edit path commands'
  ).not.toBe(preEditPathCommands);
});
