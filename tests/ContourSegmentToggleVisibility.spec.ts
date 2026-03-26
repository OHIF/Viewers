import { expect, test, visitStudy, getSvgPath, navigateWithViewportArrow } from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject,
  rightPanelPageObject
}) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await page.waitForTimeout(5000);
  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0).click();
  await page.waitForTimeout(1000);
});

test('should toggle all segments visibility - on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const svgPathLocator = viewportPageObject.getById('default').svg('path');

  await expect(svgPathLocator, 'Expected first segment SVG paths to be visible').toHaveCount(2);

  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  await expect(svgPathLocator, 'Expected no SVG paths after toggling all visibility off').toHaveCount(0);

  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  await expect(svgPathLocator, 'Expected SVG path count to match initial after toggling all back on').toHaveCount(2);
});


test('when segment visibility is off it is not shown when clicked on', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  await expect(svgPathLocator, 'All segments to be hidden').toHaveCount(0);

  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  await expect(svgPathLocator, 'All segments to remain hidden').toHaveCount(0);

  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(2).click();
  await expect(svgPathLocator, 'All segments to remain hidden').toHaveCount(0);
});


test('when segment visibility is off it is not shown when viewport contour navigation is used', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  await expect(svgPathLocator, 'All segments to be hidden').toHaveCount(0);

  await navigateWithViewportArrow(viewportPageObject, 'next');
  await expect(svgPathLocator, 'All segments to remain hidden ').toHaveCount(0);

  await navigateWithViewportArrow(viewportPageObject, 'next');
  await expect(svgPathLocator, 'All segments to remain hidden ').toHaveCount(0);
});

test('should restore svg paths when segment visibility is toggled on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
  page
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment0.toggleVisibility();
  const svgPathBefore = await getSvgPath(viewportPageObject);
  expect(svgPathBefore, 'Expected a visible SVG path for segment 0').not.toBeNull();

  await segment0.toggleVisibility();
  await expect(viewportPageObject.getById('default').svg('path'), 'No segment to be displayed').toHaveCount(0);

  await segment0.toggleVisibility();
  const svgPathAfter = await getSvgPath(viewportPageObject);
  expect(svgPathAfter, 'Expected SVG path to be restored after toggling visibility back on').toBe(svgPathBefore);
});

test('should toggle an individual segment visibility - on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Establish known state by selecting segment 1
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1).click();
  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  await expect(svgPathLocator, 'Expected first segment SVG paths to be visible').toHaveCount(4);

  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment0.toggleVisibility();
  await expect(svgPathLocator, 'Expected count to be 3 segments remaining').toHaveCount(3);

  const segment1 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1);
  await segment1.toggleVisibility();
  await expect(svgPathLocator, 'Expected count to be 2 segments remaining').toHaveCount(2);

  await segment0.toggleVisibility();
  await expect(svgPathLocator, 'Expected count to be back to 3 segments remaining').toHaveCount(3);

  await segment1.toggleVisibility();
  await expect(svgPathLocator, 'Expected count to be restored to initial').toHaveCount(4);
});
