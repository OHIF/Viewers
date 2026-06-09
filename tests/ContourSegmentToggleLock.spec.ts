import { expect, getSvgAttribute, test, visitStudy, waitForViewportsRendered } from './utils';
import { simulateNormalizedDragOnElement } from './utils/simulateDragOnElement';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
});

test('should show the lock indicator and flip the menu label between Lock and Unlock', async ({
  page,
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const segment0 = panel.nthSegment(0);
  await expect(segment0.title).toHaveText(defaultSegment0Name);

  // The lock icon (svg group #Lock) is only rendered inside the row once locked.
  const rowLockIcon = segment0.locator.locator('g#Lock');
  await expect(rowLockIcon, 'Expected the row to start unlocked (no lock icon)').toHaveCount(0);

  //open the actions menu and check that the toggle option reads "Lock" before locking
  await segment0.actions.click();
  const lockToggle = page.getByTestId('LockToggle');
  await expect(lockToggle, 'Expected the menu item to read "Lock" before locking').toHaveText(
    'Lock'
  );

  // Lock the segment by clicking the already-open menu item.
  await lockToggle.click();

  await expect(rowLockIcon, 'Expected the lock icon to appear on the row after locking').toHaveCount(1);

  // Reopen the actions menu: the toggle label should now read "Unlock".
  await segment0.actions.click();
  await expect(
    lockToggle,
    'Expected the menu item to read "Unlock" after locking'
  ).toHaveText('Unlock');

  // Unlock the segment again by clicking the already-open menu item.
  await lockToggle.click();

  await expect(
    rowLockIcon,
    'Expected the lock icon to disappear from the row after unlocking'
  ).toHaveCount(0);

  await segment0.actions.click();
  await expect(
    lockToggle,
    'Expected the menu item to read "Lock" again after unlocking'
  ).toHaveText('Lock');
});

test('should stop a locked contour segment from responding to drag edits', async ({
  page,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;

  await rightPanelPageObject.contourSegmentationPanel.segmentsVisibilityToggle.click();
  const segment0 = panel.nthSegment(0);
  await segment0.toggleVisibility();
  await segment0.click();

  const svgPath = (await viewportPageObject.getById('default')).svg('path');
  await expect(svgPath, 'Expected exactly one visible contour path').toHaveCount(1);

  const originalSvgPathDAttribute = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(originalSvgPathDAttribute, 'Expected a visible SVG path for the unlocked segment').not.toBeNull();

  // Lock the segment via the actions menu.
  await segment0.actions.toggleLock();

  // drag path after locking
  await simulateNormalizedDragOnElement({
    locator: svgPath,
    start: { x: 0.8, y: 0.8 },
    end: { x: 0.2, y: 0.2 },
  });

  // Recapture svg path d attribute after dragging
  const svgPathDAttributeAfterDragWhileLocked = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(svgPathDAttributeAfterDragWhileLocked, 'Expected a visible SVG path for the locked segment after dragging').not.toBeNull();

  // The path should not have changed after the drag attempt while locked.
  expect(
    svgPathDAttributeAfterDragWhileLocked,
    'Expected the contour path to remain unchanged after dragging while locked'
  ).toBe(originalSvgPathDAttribute);

  // unlock the contour segment and try dragging again to confirm the path can change after unlocking
  await segment0.actions.toggleLock();

  //drag path after unlocking using same motion as while it was locked
  await simulateNormalizedDragOnElement({
    locator: svgPath,
    start: { x: 0.8, y: 0.8 },
    end: { x: 0.2, y: 0.2 },
  });

  // get svg path after dragging
  const svgPathDAttributeAfterDragWhileUnlocked = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  expect(svgPathDAttributeAfterDragWhileUnlocked, 'Expected a visible SVG path for the segment before dragging after unlocking').not.toBeNull();

  // The path should change after dragging while unlocked.
  expect(
    svgPathDAttributeAfterDragWhileUnlocked,
    'Expected the contour path to change after dragging while unlocked'
  ).not.toBe(originalSvgPathDAttribute);
});
