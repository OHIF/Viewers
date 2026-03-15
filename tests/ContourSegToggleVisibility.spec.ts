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
  await rightPanelPageObject.contourSegmentationPanel.panel.selectNthSegment(0);
  await page.waitForTimeout(1000);
});

test('should toggle all segments visibility - on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'Expected first segment SVG paths to be visible').toBe(2);

  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const hiddenCount = await svgPathLocator.count();
  expect(hiddenCount, 'Expected no SVG paths after toggling all visibility off').toBe(0);

  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const restoredCount = await svgPathLocator.count();
  expect(restoredCount, 'Expected SVG path count to match initial after toggling all back on').toBe(initialCount);
});


test('when segment visibility is off it is not shown when clicked on', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'All segments to be hidden').toBe(0);

  await rightPanelPageObject.contourSegmentationPanel.panel.selectNthSegment(1);
  const countAfterfirstSelection = await svgPathLocator.count();
  expect(countAfterfirstSelection, 'All segments to remain hidden').toBe(0);

  await rightPanelPageObject.contourSegmentationPanel.panel.selectNthSegment(2);
  const countAfterSecondSelection = await svgPathLocator.count();
  expect(countAfterSecondSelection, 'All segments to remain hidden').toBe(0);
});


test('when segment visibility is off it is not shown when viewport contour navigation is used', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

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
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment0.toggleVisibility();
  const svgPathBefore = await getSvgPath(viewportPageObject);
  expect(svgPathBefore, 'Expected a visible SVG path for segment 0').not.toBeNull();

  await segment0.toggleVisibility();
  const svgCountAfterToggle = await viewportPageObject.getById('default').svg('path').count();
  expect(svgCountAfterToggle, 'No segment to be displayed').toBe(0);

  await segment0.toggleVisibility();
  const svgPathAfter = await getSvgPath(viewportPageObject);
  expect(svgPathAfter, 'Expected SVG path to be restored after toggling visibility back on').toBe(svgPathBefore);
});

test('should toggle an individual segment visibility - on/off', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  // Establish known state by selecting segment 1
  await rightPanelPageObject.contourSegmentationPanel.panel.selectNthSegment(1);
  const svgPathLocator = viewportPageObject.getById('default').svg('path');
  const initialCount = await svgPathLocator.count();
  expect(initialCount, 'Expected first segment SVG paths to be visible').toBe(4);

  const segment0 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0);
  await segment0.toggleVisibility();
  const countAfterFirstSeg0Toggle = await svgPathLocator.count();
  expect(countAfterFirstSeg0Toggle, 'Expected count to be 3 segments remaining').toBe(3);

  const segment1 = rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(1);
  await segment1.toggleVisibility();
  const countAfterFirstSeg1Toggle = await svgPathLocator.count();
  expect(countAfterFirstSeg1Toggle, 'Expected count to be 2 segments remaining').toBe(2);

  await segment0.toggleVisibility();
  const countAfterSecondSeg0Toggle = await svgPathLocator.count();
  expect(countAfterSecondSeg0Toggle, 'Expected count to be back to 3 segments remaining').toBe(3);

  await segment1.toggleVisibility();
  const countAfterSecondSeg1Toggle = await svgPathLocator.count();
  expect(countAfterSecondSeg1Toggle, 'Expected count to be restored to initial').toBe(initialCount);
});
