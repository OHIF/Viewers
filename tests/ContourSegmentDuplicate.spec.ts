import {
  expect,
  test,
  visitStudy,
  getSvgPath,
  waitForViewportsRendered,
} from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';
const defaultSegment1Name = 'Big Sphere';

test.beforeEach(async ({
  page,
  leftPanelPageObject,
  DOMOverlayPageObject,
}) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await expect(page.getByTestId('data-row')).toHaveCount(4);
});

test('should duplicate a contour segment and add a new row to the panel', async ({
  page,
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
  const newSegmentTitle = await panel.nthSegment(initialCount).title.textContent();
  expect(newSegmentTitle, 'Expected correct title for duplicated segment').toBe(`Segment 5`);

  // Original segment titles should be unchanged
  await expect(panel.nthSegment(0).title).toHaveText(defaultSegment0Name);
  await expect(panel.nthSegment(1).title).toHaveText(defaultSegment1Name);
});

test('should duplicate the same segment multiple times', async ({
  page,
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  const segment0 = panel.nthSegment(0);

  await segment0.actions.duplicate();
  await expect(page.getByTestId('data-row')).toHaveCount(5);

  const firstDuplicateTitle = await panel.nthSegment(4).title.textContent();
  expect(firstDuplicateTitle, 'Expected correct title for first duplicated segment').toBe(`Segment 5`);

  await segment0.actions.duplicate();
  expect(await panel.getSegmentCount(), 'Expected another segment row after duplicating the same segment again').toBe(6);

  const secondDuplicateTitle = await panel.nthSegment(5).title.textContent();
  expect(secondDuplicateTitle, 'Expected correct title for second duplicated segment').toBe(`Segment 6`);
});

test('should render the duplicated contour on the viewport', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  // Hide everything, to be able to grab only the SVG path of the segment to duplicate
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const segment0 = panel.nthSegment(0);
  await segment0.toggleVisibility();
  await segment0.click();

  const sourceSvgPath = await getSvgPath(viewportPageObject);

  // New segment is at index 4
  await segment0.actions.duplicate();
  const duplicatedSegment = panel.nthSegment(4);

  // Hide again to show duplicate only
  await segment0.toggleVisibility();
  await duplicatedSegment.click();

  const duplicatedSvgPath = await getSvgPath(viewportPageObject);

  expect(
    duplicatedSvgPath,
    'Expected the duplicated segment to have the same SVG path as the source'
  ).toBe(sourceSvgPath);
});
