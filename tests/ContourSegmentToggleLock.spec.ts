import {
  contourShowOnlyNthSegment,
  expect,
  getSvgAttribute,
  simulateNormalizedDragOnElement,
  test,
  visitStudyAndHydrate,
} from './utils';
import { expectRowLocked, expectRowUnlocked } from './utils/assertions';

const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
const defaultSegment0Name = 'Threshold';

test.beforeEach(async ({ page, leftPanelPageObject, DOMOverlayPageObject }) => {
  await visitStudyAndHydrate({
    page,
    leftPanelPageObject,
    DOMOverlayPageObject,
    studyInstanceUID,
    modality: 'RTSTRUCT',
  });
});

test('should show the lock indicator and flip the menu label between Lock and Unlock', async ({
  rightPanelPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const segment0 = panel.nthSegment(0);
  await expect(segment0.title).toHaveText(defaultSegment0Name);

  // The lock icon is only rendered inside the row once locked.
  await expectRowUnlocked(segment0);

  let lockToggle = await segment0.actions.openLockToggleMenuItem();
  await expect(lockToggle, 'Expected the menu item to read "Lock" before locking').toHaveText(
    'Lock'
  );

  // Lock the segment by clicking the already-open menu item.
  await lockToggle.click();
  await expectRowLocked(segment0);

  // Reopen the actions menu: the toggle label should now read "Unlock".
  lockToggle = await segment0.actions.openLockToggleMenuItem();
  await expect(lockToggle, 'Expected the menu item to read "Unlock" after locking').toHaveText('Unlock');

  // Unlock the segment again by clicking the already-open menu item.
  await lockToggle.click();
  await expectRowUnlocked(segment0);

  lockToggle = await segment0.actions.openLockToggleMenuItem();
  await expect(
    lockToggle,
    'Expected the menu item to read "Lock" again after unlocking'
  ).toHaveText('Lock');
});

test('should stop a locked contour segment from responding to drag edits', async ({
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const panel = rightPanelPageObject.contourSegmentationPanel.panel;
  const segment0 = panel.nthSegment(0);
  await expect(
    segment0.title,
    'Expected the first segment to be the Threshold segment'
  ).toHaveText(defaultSegment0Name);

  // Isolate segment 0 so the viewport renders exactly one contour path and it is
  // the active segment for the drag edits below.
  await contourShowOnlyNthSegment({
    segmentationPanel: rightPanelPageObject.contourSegmentationPanel,
  });

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
  await expectRowLocked(segment0);

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
  await expectRowUnlocked(segment0);

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
