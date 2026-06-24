import {
  contourShowOnlyNthSegment,
  expect,
  getSvgAttribute,
  test,
  visitStudyAndHydrate,
} from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';
const defaultSegment1Name = 'Big Sphere';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
});

test('should duplicate a contour segment and add a new row to the panel', async ({
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  const initialCount = await panel.getSegmentCount();
  expect(initialCount, 'Expected to load with 4 segments').toBe(4);

  const segment0 = panel.nthSegment(0);
  await expect(segment0.title).toHaveText(defaultSegment0Name);

  await segment0.actions.duplicate();

  const countAfterDuplicate = await panel.getSegmentCount();
  expect(countAfterDuplicate, 'Expected one additional segment row after duplicating').toBe(5);

  //New segment's default name is formatted as "Segment {segmentCount}"
  const newSegmentLocator = panel.nthSegment(initialCount).title;
  await expect(newSegmentLocator, 'Expected correct title for duplicated segment').toHaveText(
    `Segment 5`
  );

  // Original segment titles should be unchanged
  await expect(panel.nthSegment(0).title).toHaveText(defaultSegment0Name);
  await expect(panel.nthSegment(1).title).toHaveText(defaultSegment1Name);
});

test('should duplicate the same segment multiple times', async ({ rightPanelPageObject }) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  const segment0 = panel.nthSegment(0);

  await segment0.actions.duplicate();
  expect(
    await panel.getSegmentCount(),
    'Expected one additional segment row after duplicating'
  ).toBe(5);

  const firstDuplicateTitleLocator = panel.nthSegment(4).title;
  await expect(
    firstDuplicateTitleLocator,
    'Expected correct title for first duplicated segment'
  ).toHaveText(`Segment 5`);

  await segment0.actions.duplicate();
  expect(
    await panel.getSegmentCount(),
    'Expected another segment row after duplicating the same segment again'
  ).toBe(6);

  const secondDuplicateTitleLocator = panel.nthSegment(5).title;
  await expect(
    secondDuplicateTitleLocator,
    'Expected correct title for second duplicated segment'
  ).toHaveText(`Segment 6`);
});

test('should render the duplicated contour on the viewport', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  // Hide everything, to be able to grab only the SVG path of the segment to duplicate
  const segment0 = await contourShowOnlyNthSegment({
    segmentationPanel: rightPanelPageObject.contourSegmentationPanel,
  });

  const sourceSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(sourceSvgPath, 'Expected a visible SVG path for the source segment').not.toBeNull();
  const sourceSvgPaths = (await viewportPageObject.getById('default')).svg('path');
  expect(sourceSvgPaths, 'Expected only one SVG path element for the original segment').toHaveCount(
    1
  );

  // New segment is at index 4
  await segment0.actions.duplicate();
  const duplicatedSegment = panel.nthSegment(4);

  // Hide again to show duplicate only
  await segment0.toggleVisibility();
  await duplicatedSegment.click();

  const duplicatedSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(
    duplicatedSvgPath,
    'Expected a visible SVG path for the duplicated segment'
  ).not.toBeNull();
  const duplicatedSvgPaths = (await viewportPageObject.getById('default')).svg('path');
  expect(
    duplicatedSvgPaths,
    'Expected only one SVG path element for the duplicated segment'
  ).toHaveCount(1);

  expect(
    duplicatedSvgPath,
    'Expected the duplicated segment to have the same SVG path as the source'
  ).toBe(sourceSvgPath);
});

test('should navigate to the correct instance number when a duplicated contour segment is selected', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  // get instance overlay of the contour segment at index 0
  const originalSegment = panel.nthSegment(0);
  await originalSegment.click();
  const originalSegmentInstanceInfo = (await viewportPageObject.getById('default')).overlayText
    .bottomRight.instanceNumber;
  expect(
    originalSegmentInstanceInfo,
    'Expected instance information to be displayed in the viewport overlay'
  ).toBeVisible();
  await expect(
    originalSegmentInstanceInfo,
    'Expected instance information to be slice 46 for the Threshold segment'
  ).toHaveText('I:46 (46/47)');

  // Duplicate segment so new segment is at index 4
  await originalSegment.actions.duplicate();

  //click another segment to ensure instance number changes accordingly
  await panel.nthSegment(2).click();
  const anotherSegmentInstanceInfo = (await viewportPageObject.getById('default')).overlayText
    .bottomRight.instanceNumber;
  expect(
    anotherSegmentInstanceInfo,
    'Expected instance information to be displayed in the viewport overlay'
  ).toBeVisible();
  await expect(
    anotherSegmentInstanceInfo,
    'Expected instance information to be different from original contour'
  ).not.toHaveText('I:46 (46/47)');

  //click duplicated segment to ensure instance number is consistent with original segment
  const duplicatedSegment = panel.nthSegment(4);
  await duplicatedSegment.click();
  const duplicatedSegmentInstanceInfoAfter = (await viewportPageObject.getById('default'))
    .overlayText.bottomRight.instanceNumber;
  expect(
    duplicatedSegmentInstanceInfoAfter,
    'Expected instance information to be displayed in the viewport overlay'
  ).toBeVisible();
  await expect(
    duplicatedSegmentInstanceInfoAfter,
    'Expected instance information to be same as original contour after clicking duplicated segment'
  ).toHaveText('I:46 (46/47)');

  //verify the svg paths are the same for the original and duplicated segments
  await contourShowOnlyNthSegment({
    segmentationPanel: rightPanelPageObject.contourSegmentationPanel,
  });
  const originalSegmentSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(
    originalSegmentSvgPath,
    'Expected a visible SVG path for the original segment'
  ).not.toBeNull();

  // hide original segment to show duplicate only
  await originalSegment.toggleVisibility();

  await duplicatedSegment.toggleVisibility();
  await duplicatedSegment.click();
  const duplicatedSegmentSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(
    duplicatedSegmentSvgPath,
    'Expected a visible SVG path for the duplicated segment'
  ).not.toBeNull();

  expect(
    duplicatedSegmentSvgPath,
    'Expected the duplicated segment to have the same SVG path as the original segment'
  ).toBe(originalSegmentSvgPath);
});
