import { expect, test, visitStudy, getSvgPath, navigateWithViewportArrow, toggleAllSegmentsVisibility, toggleSegmentVisibility } from './utils';

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
  page,
}) => {
  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'Expected at least one visible SVG path initially').toBeGreaterThan(0);

  await toggleAllSegmentsVisibility(rightPanelPageObject, page);

  const hiddenCount = await svgPathLocator.count();
  expect(hiddenCount, 'Expected no SVG paths after toggling all visibility off').toBe(0);

  await toggleAllSegmentsVisibility(rightPanelPageObject, page);

  const restoredCount = await svgPathLocator.count();
  expect(restoredCount, 'Expected SVG path count to match initial after toggling all back on').toBe(initialCount);
});


test('when segment visibility is off it is not shown when clicked on', async ({
  rightPanelPageObject,
  viewportPageObject,
  page,
}) => {
  await toggleAllSegmentsVisibility(rightPanelPageObject, page);

  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'All segments to be hidden').toBe(0);

  rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0).click();
  const countAfterfirstSelection = await svgPathLocator.count();
  expect(countAfterfirstSelection, 'All segments to remain hidden ').toBe(0);

  rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0).click();
  const countAfterSecondSelection = await svgPathLocator.count();
  expect(countAfterSecondSelection, 'All segments to remain hidden ').toBe(0);
});


test('when segment visibility is off it is not shown when viewport contour navigation is used', async ({
  rightPanelPageObject,
  viewportPageObject,
  page,
}) => {
  await toggleAllSegmentsVisibility(rightPanelPageObject, page);

  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'All segments to be hidden').toBe(0);

  await navigateWithViewportArrow(viewportPageObject, 'next');
  const countAfterFirstNavigation = await svgPathLocator.count();
  expect(countAfterFirstNavigation, 'All segments to remain hidden ').toBe(0);

  await navigateWithViewportArrow(viewportPageObject, 'next');
  const countAfterSecondNavigation = await svgPathLocator.count();
  expect(countAfterSecondNavigation, 'All segments to remain hidden ').toBe(0);
});

test('should restore svg paths when segment visibility is toggled on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
  page
}) => {
  await toggleAllSegmentsVisibility(rightPanelPageObject, page);

  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await toggleSegmentVisibility(segment0, page);
  const svgPathBefore = await getSvgPath(viewportPageObject);
  expect(svgPathBefore, 'Expected a visible SVG path for segment 0').not.toBeNull();

  await toggleSegmentVisibility(segment0, page);
  const svgCountAfterToggle = await viewportPageObject.getById('default').svg('path').count();
  expect(svgCountAfterToggle, 'No segment to be displayed').toBe(0);

  await toggleSegmentVisibility(segment0, page);

  const svgPathAfter = await getSvgPath(viewportPageObject);
  expect(svgPathAfter, 'Expected SVG path to be restored after toggling visibility back on').toBe(svgPathBefore);
});
