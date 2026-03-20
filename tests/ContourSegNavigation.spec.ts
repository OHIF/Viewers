import { expect, test, visitStudy, getSvgPath, navigateWithViewportArrow } from './utils';
import { expectRowSelected } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject,
  rightPanelPageObject
}) => {
  await visitStudy(page, studyInstanceUID, { mode: 'segmentation' });
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
  await expectRowSelected(getSegment(3));

  await getSegment(2).click();
  const seg2 = await getSvgPath(viewportPageObject);
  expect(seg2, 'Segment at index 2: expected a non-null SVG path').not.toBeNull();
  await expectRowSelected(getSegment(2));

  await getSegment(1).click();
  const seg1 = await getSvgPath(viewportPageObject);
  expect(seg1, 'Segment at index 1: expected a non-null SVG path').not.toBeNull();
  await expectRowSelected(getSegment(1));

  // Clicking segments again should return the original paths
  await getSegment(2).click();
  const seg2Again = await getSvgPath(viewportPageObject);
  expect(seg2Again, 'Segment 2 again: expected to match the original segment 2 path').toBe(seg2);
  await expectRowSelected(getSegment(2));

  await getSegment(1).click();
  const seg1Again = await getSvgPath(viewportPageObject);
  expect(seg1Again, 'Segment 1 again: expected to match the original segment 1 path').toBe(seg1);
  await expectRowSelected(getSegment(1));

  await getSegment(0).click();
  const seg0Again = await getSvgPath(viewportPageObject);
  expect(seg0Again, 'Segment 0 again: expected to match the original segment 0 path').toBe(seg0);
  await expectRowSelected(getSegment(0));

  await getSegment(3).click();
  const seg3Again = await getSvgPath(viewportPageObject);
  expect(seg3Again, 'Segment 3 again: expected to match the original segment 3 path').toBe(seg3);
  await expectRowSelected(getSegment(3));
});

test('should navigate the segmentations using the Viewport arrow buttons', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const getSegment = (index: number) =>
    rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(index);

  const initialSvgPath = await getSvgPath(viewportPageObject);
  expect(initialSvgPath, 'Segment at index 0: expected a non-null SVG path').not.toBeNull();
  // Expect the correct segment to be selected in the right panel
  await expectRowSelected(getSegment(0));

  await navigateWithViewportArrow(viewportPageObject, 'next');
  const secondSvgPath = await getSvgPath(viewportPageObject);
  expect(secondSvgPath, 'Segment at index 1: expected a different SVG path from segment 0').not.toBe(initialSvgPath);
  await expectRowSelected(getSegment(1));

  await navigateWithViewportArrow(viewportPageObject, 'next');
  const thirdSvgPath = await getSvgPath(viewportPageObject);
  expect(thirdSvgPath, 'Segment at index 2: expected a different SVG path from segment 1').not.toBe(secondSvgPath);
  await expectRowSelected(getSegment(2));

  await navigateWithViewportArrow(viewportPageObject, 'next');
  const fourthSvgPath = await getSvgPath(viewportPageObject);
  expect(fourthSvgPath, 'Segment at index 3: expected a different SVG path from segment 2').not.toBe(thirdSvgPath);
  await expectRowSelected(getSegment(3));

  // Wraparound test — next from last should return to first segment
  await navigateWithViewportArrow(viewportPageObject, 'next');
  const svgPathWraparoundWithNext = await getSvgPath(viewportPageObject);
  expect(
    svgPathWraparoundWithNext,
    'Expected svg path to match the initial svg path after wrapping around with next navigation'
  ).toBe(initialSvgPath);
  await expectRowSelected(getSegment(0));

  // Wraparound test — prev from first should return to last segment
  await navigateWithViewportArrow(viewportPageObject, 'prev');
  const svgPathWraparoundWithPrev = await getSvgPath(viewportPageObject);
  expect(
    svgPathWraparoundWithPrev,
    'Expected svg path to match the fourth svg path after wrapping around with prev navigation'
  ).toBe(fourthSvgPath);
  await expectRowSelected(getSegment(3));

  await navigateWithViewportArrow(viewportPageObject, 'prev');
  const backToThirdSvgPath = await getSvgPath(viewportPageObject);
  expect(backToThirdSvgPath, 'Expected path to match third segment after going prev from fourth').toBe(thirdSvgPath);
  await expectRowSelected(getSegment(2));

  await navigateWithViewportArrow(viewportPageObject, 'prev');
  const backToSecondSvgPath = await getSvgPath(viewportPageObject);
  expect(backToSecondSvgPath, 'Expected path to match second segment after going prev from third').toBe(secondSvgPath);
  await expectRowSelected(getSegment(1));

  await navigateWithViewportArrow(viewportPageObject, 'prev');
  const backToFirstSvgPath = await getSvgPath(viewportPageObject);
  expect(backToFirstSvgPath, 'Expected path to match first segment after going prev from second').toBe(initialSvgPath);
  await expectRowSelected(getSegment(0));
});
