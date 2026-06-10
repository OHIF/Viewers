import {
  expect,
  test,
  visitStudy,
  waitForViewportsRendered,
  getSvgAttribute,
} from './utils';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';
const defaultSegment1Name = 'Big Sphere';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
});

test('should delete a contour segment and remove its row from the panel', async ({
  page,
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  const initialCount = await panel.getSegmentCount();
  expect(initialCount, 'Expected to load with 4 segments').toBe(4);

  const segment0 = panel.nthSegment(0);
  await expect(segment0.title).toHaveText(defaultSegment0Name);

  await segment0.actions.delete();

  const countAfterDelete = await panel.getSegmentCount();
  expect(countAfterDelete, 'Expected one fewer segment row after deleting').toBe(3);
  // The deleted segment's title should no longer be present anywhere in the panel
  await expect(
    page.getByTestId('data-row-title').filter({ hasText: defaultSegment0Name }),
    'Expected the deleted segment title to be gone from the panel'
  ).toHaveCount(0);

  // Check that the next segment index is moved up
  await expect(
    panel.nthSegment(0).title,
    'Expected the next segment to take the first row after deletion'
  ).toHaveText(defaultSegment1Name);
});

test('should delete multiple contour segments sequentially', async ({page, rightPanelPageObject }) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  const initialCount = await panel.getSegmentCount();
  expect(initialCount, 'Expected to load with 4 segments').toBe(4);

  await panel.nthSegment(0).actions.delete();
  const countAfterFirstDelete = await panel.getSegmentCount();
  expect(countAfterFirstDelete, 'Expected 3 segments after first delete').toBe(3);

  await panel.nthSegment(0).actions.delete();
  const countAfterSecondDelete = await panel.getSegmentCount();
  expect(countAfterSecondDelete, 'Expected 2 segments after second delete').toBe(2);

  await expect(
    page.getByTestId('data-row-title').filter({ hasText: defaultSegment0Name }),
    'Expected the deleted Threshold segment title to be gone from the panel'
  ).toHaveCount(0);

  await expect(
    page.getByTestId('data-row-title').filter({ hasText: defaultSegment1Name }),
    'Expected the deleted Big Sphere segment title to be gone from the panel'
  ).toHaveCount(0);
});

test('should remove the deleted segment contour from the viewport', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  // Hide everything, then show only the segment we are going to delete so the
  // viewport renders exactly one contour path we can assert on.
  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();

  const segment0 = panel.nthSegment(0);
  await segment0.toggleVisibility();
  await segment0.click();

  const svgPathLocator = (await viewportPageObject.getById('default')).svg('path');
  await expect(svgPathLocator, 'Expected exactly one visible contour path before delete').toHaveCount(1);

  // Capture the contour path of the segment we are about to delete
  const segmentToBeDeletedSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(segmentToBeDeletedSvgPath, 'Expected a visible SVG path for the segment to delete').not.toBeNull();

  await segment0.actions.delete();
  await expect(
    page.getByTestId('data-row-title').filter({ hasText: defaultSegment0Name }),
    'Expected the Threshold segment title to be gone from the panel'
  ).toHaveCount(0);

  await expect(
    svgPathLocator,
    'Expected the deleted segment contour to be removed from the viewport'
  ).toHaveCount(0);

  // After deletion, show new segment at the deleted index and verify its contour is a different from the deleted one.
  const newSegment0 = panel.nthSegment(0);
  await newSegment0.toggleVisibility();
  await newSegment0.click();

  await expect(
    svgPathLocator,
    'Expected the new index-0 segment contour to be visible'
  ).toHaveCount(1);

  const newSegmentSvgPath = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(newSegmentSvgPath, 'Expected a visible SVG path for the new index-0 segment').not.toBeNull();

  expect(
    newSegmentSvgPath,
    'Expected the new index-0 segment contour to differ from the deleted segment'
  ).not.toBe(segmentToBeDeletedSvgPath);
});
