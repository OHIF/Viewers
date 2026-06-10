import {
  expect,
  getSvgAttribute,
  test,
  visitStudy,
  waitForViewportRenderCycle,
  waitForViewportsRendered,
} from './utils';
import { simulateNormalizedDragOnElement } from './utils/simulateDragOnElement';
import { expectRowLocked, expectRowUnlocked } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  const mode = 'segmentation';
  await visitStudy(page, studyInstanceUID, mode, 2000);

  await leftPanelPageObject.loadSeriesByModality('RTSTRUCT');
  await waitForViewportsRendered(page);
  await expect(DOMOverlayPageObject.viewport.segmentationHydration.locator).toBeVisible();

  await DOMOverlayPageObject.viewport.segmentationHydration.yes.click();
  await waitForViewportRenderCycle(page);
});

test('should show the lock indicator and flip the menu label between Lock and Unlock', async ({
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const segment0 = panel.nthSegment(0);
  await expect(segment0.title).toHaveText(defaultSegment0Name);

  // The lock icon is only rendered inside the row once locked.
  await expectRowUnlocked(segment0.locator);

  await segment0.actions.click();
  const lockToggle = segment0.actions.lockToggleMenuItem;
  await expect(lockToggle, 'Expected the menu item to read "Lock" before locking').toHaveText(
    'Lock'
  );

  // Lock the segment by clicking the already-open menu item.
  await lockToggle.click();
  await expectRowLocked(segment0.locator);

  // Reopen the actions menu: the toggle label should now read "Unlock".
  await segment0.actions.click();
  await expect(lockToggle, 'Expected the menu item to read "Unlock" after locking').toHaveText(
    'Unlock'
  );

  // Unlock the segment again by clicking the already-open menu item.
  await lockToggle.click();
  await expectRowUnlocked(segment0.locator);

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

  // Hide all segments and show only segment 0 so the viewport contains a single contour
  // path, then select it so it is the active segment for the drag edits below.
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

  // Lock the segment via the actions menu and confirm the lock state has propagated
  // to the row before dragging.
  await segment0.actions.toggleLock();
  await expectRowLocked(segment0.locator);

  // Drag the path while locked.
  await simulateNormalizedDragOnElement({
    locator: svgPath,
    start: { x: 0.8, y: 0.8 },
    end: { x: 0.2, y: 0.2 },
  });

  const svgPathDAttributeAfterDragWhileLocked = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });

  // The path should not have changed after the drag attempt while locked.
  expect(
    svgPathDAttributeAfterDragWhileLocked,
    'Expected the contour path to remain unchanged after dragging while locked'
  ).toBe(originalSvgPathDAttribute);

  // Unlock the segment and confirm the lock indicator is gone before dragging again.
  await segment0.actions.toggleLock();
  await expectRowUnlocked(segment0.locator);

  // Drag with the same motion as while locked.
  await simulateNormalizedDragOnElement({
    locator: svgPath,
    start: { x: 0.8, y: 0.8 },
    end: { x: 0.2, y: 0.2 },
  });

  const svgPathDAfterDragWhileUnlocked = await getSvgAttribute({
    viewportPageObject,
    svgInnerElement: 'path',
    attributeName: 'd',
  });
  // The path should change after dragging while unlocked.
  expect(
    svgPathDAfterDragWhileUnlocked,
    'Expected the contour path to change after dragging while unlocked'
  ).not.toBe(originalSvgPathDAttribute);
});
