import { expect, test, visitStudy, getSvgPath } from './utils';

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
  // Click segment 0 in the right panel to establish a known starting position
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0).click();
  await page.waitForTimeout(5000);
});

test('should navigate the contours when clicking each segments in the right panel', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const getSegment = (index: number) =>
    rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(index);

  const seg0 = await getSvgPath(viewportPageObject);
  expect(seg0, 'Segment at index 0: expected a non-null SVG path').not.toBeNull();

  await getSegment(3).click();
  const seg3 = await getSvgPath(viewportPageObject);
  expect(seg3, 'Segment at index 3: expected a non-null SVG path').not.toBeNull();
  await expect(getSegment(3).locator).toHaveClass(/bg-popover/);


  await getSegment(2).click();
  const seg2 = await getSvgPath(viewportPageObject);
  expect(seg2, 'Segment at index 2: expected a non-null SVG path').not.toBeNull();
  await expect(getSegment(2).locator).toHaveClass(/bg-popover/);

  await getSegment(1).click();
  const seg1 = await getSvgPath(viewportPageObject);
  expect(seg1, 'Segment at index 1: expected a non-null SVG path').not.toBeNull();
  await expect(getSegment(1).locator).toHaveClass(/bg-popover/);

  // Clicking segments again should return the original paths
  await getSegment(2).click();
  const seg2Again = await getSvgPath(viewportPageObject);
  expect(seg2Again, 'Segment 2 again: expected to match the original segment 2 path').toBe(seg2);
  await expect(getSegment(2).locator).toHaveClass(/bg-popover/);

  await getSegment(1).click();
  const seg1Again = await getSvgPath(viewportPageObject);
  expect(seg1Again, 'Segment 1 again: expected to match the original segment 1 path').toBe(seg1);
  await expect(getSegment(1).locator).toHaveClass(/bg-popover/);

  await getSegment(0).click();
  const seg0Again = await getSvgPath(viewportPageObject);
  expect(seg0Again, 'Segment 0 again: expected to match the original segment 0 path').toBe(seg0);
  await expect(getSegment(0).locator).toHaveClass(/bg-popover/);

  await getSegment(3).click();
  const seg3Again = await getSvgPath(viewportPageObject);
  expect(seg3Again, 'Segment 3 again: expected to match the original segment 3 path').toBe(seg3);
  await expect(getSegment(3).locator).toHaveClass(/bg-popover/);
});

test('should navigate the segmentations using the Viewport arrow buttons', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const getSegment = (index: number) =>
    rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(index);

  const navigateWithArrow = async (direction: 'next' | 'prev') => {
    await viewportPageObject.getById('default').getNavigationArrows()[direction].click();
  };

  const initialSvgPath = await getSvgPath(viewportPageObject);
  expect(initialSvgPath, 'Segment at index 0: expected a non-null SVG path').not.toBeNull();
  // Expect segment the correct segment to be selected in the right panel
  await expect(getSegment(0).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('next');
  const secondSvgPath = await getSvgPath(viewportPageObject);
  expect(secondSvgPath, 'Segment at index 1: expected a different SVG path from segment 0').not.toBe(initialSvgPath);
  await expect(getSegment(1).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('next');
  const thirdSvgPath = await getSvgPath(viewportPageObject);
  expect(thirdSvgPath, 'Segment at index 2: expected a different SVG path from segment 1').not.toBe(secondSvgPath);
  await expect(getSegment(2).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('next');
  const fourthSvgPath = await getSvgPath(viewportPageObject);
  expect(fourthSvgPath, 'Segment at index 3: expected a different SVG path from segment 2').not.toBe(thirdSvgPath);
  await expect(getSegment(3).locator).toHaveClass(/bg-popover/);

  // Wraparound test — next from last should return to first segment
  await navigateWithArrow('next');
  const svgPathWraparoundWithNext = await getSvgPath(viewportPageObject);
  expect(
    svgPathWraparoundWithNext,
    'Expected svg path to match the initial svg path after wrapping around with next navigation'
  ).toBe(initialSvgPath);
  await expect(getSegment(0).locator).toHaveClass(/bg-popover/);

  // Wraparound test — prev from first should return to last segment
  await navigateWithArrow('prev');
  const svgPathWraparoundWithPrev = await getSvgPath(viewportPageObject);
  expect(
    svgPathWraparoundWithPrev,
    'Expected svg path to match the fourth svg path after wrapping around with prev navigation'
  ).toBe(fourthSvgPath);
  await expect(getSegment(3).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('prev');
  const backToThirdSvgPath = await getSvgPath(viewportPageObject);
  expect(backToThirdSvgPath, 'Expected path to match third segment after going prev from fourth').toBe(thirdSvgPath);
  await expect(getSegment(2).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('prev');
  const backToSecondSvgPath = await getSvgPath(viewportPageObject);
  expect(backToSecondSvgPath, 'Expected path to match second segment after going prev from third').toBe(secondSvgPath);
  await expect(getSegment(1).locator).toHaveClass(/bg-popover/);

  await navigateWithArrow('prev');
  const backToFirstSvgPath = await getSvgPath(viewportPageObject);
  expect(backToFirstSvgPath, 'Expected path to match first segment after going prev from second').toBe(initialSvgPath);
  await expect(getSegment(0).locator).toHaveClass(/bg-popover/);
});
