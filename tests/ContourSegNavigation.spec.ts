import {
  expect,
  test,
  visitStudyAndHydrate,
  getSvgAttribute,
  navigateWithViewportArrow,
  waitForViewportsRendered,
} from './utils';
import { expectRowSelected } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject, rightPanelPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
  // Click segment 0 in the right panel to establish a known starting position
  await rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(0).click();
  await page.waitForTimeout(5000);
});

test('should navigate the contours when clicking each segments in the right panel', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const getSegment = (index: number) =>
    rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(index);

  // Clicking a segment navigates the viewport to that segment's slice and
  // re-renders its contour. Wait for the render to settle before reading the
  // SVG path so we don't capture the previous segment's path on slower CI.
  const selectSegment = async (index: number) => {
    await getSegment(index).click();
    await waitForViewportsRendered(page);
  };

  const seg0 = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg0, 'Segment at index 0: expected a non-null SVG path').not.toBeNull();

  await selectSegment(3);
  const seg3 = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg3, 'Segment at index 3: expected a non-null SVG path').not.toBeNull();
  await expectRowSelected(getSegment(3));

  await selectSegment(2);
  const seg2 = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg2, 'Segment at index 2: expected a non-null SVG path').not.toBeNull();
  await expectRowSelected(getSegment(2));

  await selectSegment(1);
  const seg1 = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg1, 'Segment at index 1: expected a non-null SVG path').not.toBeNull();
  await expectRowSelected(getSegment(1));

  // Clicking segments again should return the original paths
  await selectSegment(2);
  const seg2Again = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg2Again, 'Segment 2 again: expected to match the original segment 2 path').toBe(seg2);
  await expectRowSelected(getSegment(2));

  await selectSegment(1);
  const seg1Again = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg1Again, 'Segment 1 again: expected to match the original segment 1 path').toBe(seg1);
  await expectRowSelected(getSegment(1));

  await selectSegment(0);
  const seg0Again = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg0Again, 'Segment 0 again: expected to match the original segment 0 path').toBe(seg0);
  await expectRowSelected(getSegment(0));

  await selectSegment(3);
  const seg3Again = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(seg3Again, 'Segment 3 again: expected to match the original segment 3 path').toBe(seg3);
  await expectRowSelected(getSegment(3));
});

test('should navigate the segmentations using the Viewport arrow buttons', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const getSegment = (index: number) =>
    rightPanelPageObject.contourSegmentationPanel.panel.nthSegment(index);

  // Arrow navigation jumps to the next/prev segment and re-renders its contour.
  // Wait for the render to settle before reading the SVG path.
  const navigate = async (direction: 'next' | 'prev') => {
    await navigateWithViewportArrow(viewportPageObject, direction);
    await waitForViewportsRendered(page);
  };

  const initialSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(initialSvgPath, 'Segment at index 0: expected a non-null SVG path').not.toBeNull();
  // Expect the correct segment to be selected in the right panel
  await expectRowSelected(getSegment(0));

  await navigate('next');
  const secondSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(secondSvgPath, 'Segment at index 1: expected a different SVG path from segment 0').not.toBe(initialSvgPath);
  await expectRowSelected(getSegment(1));

  await navigate('next');
  const thirdSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(thirdSvgPath, 'Segment at index 2: expected a different SVG path from segment 1').not.toBe(secondSvgPath);
  await expectRowSelected(getSegment(2));

  await navigate('next');
  const fourthSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(fourthSvgPath, 'Segment at index 3: expected a different SVG path from segment 2').not.toBe(thirdSvgPath);
  await expectRowSelected(getSegment(3));

  // Wraparound test — next from last should return to first segment
  await navigate('next');
  const svgPathWraparoundWithNext = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(
    svgPathWraparoundWithNext,
    'Expected svg path to match the initial svg path after wrapping around with next navigation'
  ).toBe(initialSvgPath);
  await expectRowSelected(getSegment(0));

  // Wraparound test — prev from first should return to last segment
  await navigate('prev');
  const svgPathWraparoundWithPrev = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(
    svgPathWraparoundWithPrev,
    'Expected svg path to match the fourth svg path after wrapping around with prev navigation'
  ).toBe(fourthSvgPath);
  await expectRowSelected(getSegment(3));

  await navigate('prev');
  const backToThirdSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(backToThirdSvgPath, 'Expected path to match third segment after going prev from fourth').toBe(thirdSvgPath);
  await expectRowSelected(getSegment(2));

  await navigate('prev');
  const backToSecondSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(backToSecondSvgPath, 'Expected path to match second segment after going prev from third').toBe(secondSvgPath);
  await expectRowSelected(getSegment(1));

  await navigate('prev');
  const backToFirstSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(backToFirstSvgPath, 'Expected path to match first segment after going prev from second').toBe(initialSvgPath);
  await expectRowSelected(getSegment(0));
});
