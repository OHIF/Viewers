import type { Page } from '@playwright/test';

import type { MainToolbarPageObject, RightPanelPageObject, ViewportPageObject } from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';
import {
  expect,
  getSvgAttribute,
  test,
  visitStudy,
  waitForAnnotationCompleted,
  waitForViewportNotBlank,
  waitForViewportsRendered,
} from './utils';
import { expectUndoRedoEnabled } from './utils/assertions';

const STUDY_UID = '1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046';

const FREEHAND_PATH = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
  { x: 0.4, y: 0.4 },
];

const SPLINE_POINTS = [
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.6, y: 0.6 },
  { x: 0.4, y: 0.6 },
];
// Drags the second control point outward.
const SPLINE_POINT_MOVE = { start: { x: 0.6, y: 0.4 }, end: { x: 0.65, y: 0.35 } };

// Livewire snaps to image edges, so these are viewport pixels tuned to edges on this study's
// first displayed slice.
const LIVEWIRE_CLICKS = [
  { x: 350, y: 330 },
  { x: 430, y: 210 },
  { x: 570, y: 240 },
  { x: 520, y: 340 },
];

type ContourTool = {
  select: (rightPanelPageObject: RightPanelPageObject) => Promise<void>;
  draw: (viewport: IViewportPageObject) => Promise<void>;
};

type ContourFixtures = {
  page: Page;
  mainToolbarPageObject: MainToolbarPageObject;
  rightPanelPageObject: RightPanelPageObject;
  viewportPageObject: ViewportPageObject;
};

const FREEHAND_CONTOUR: ContourTool = {
  select: panel => panel.contourSegmentationPanel.tools.freehandContour.click(),
  draw: viewport => viewport.normalizedPathDragAt({ path: FREEHAND_PATH }),
};

const SPLINE_CONTOUR: ContourTool = {
  select: panel => panel.contourSegmentationPanel.tools.splineContour.click(),
  // The last click lands on the first point, which closes the spline.
  draw: viewport => viewport.normalizedClickAt([...SPLINE_POINTS, SPLINE_POINTS[0]]),
};

const LIVEWIRE_CONTOUR: ContourTool = {
  select: panel => panel.contourSegmentationPanel.tools.livewireContour.click(),
  draw: async viewport => {
    await viewport.clickAt(LIVEWIRE_CLICKS);
    await expect(viewport.svg('circle')).toHaveCount(LIVEWIRE_CLICKS.length);
    // Double-clicking the last vertex closes the contour.
    await viewport.doubleClickAt(LIVEWIRE_CLICKS[LIVEWIRE_CLICKS.length - 1]);
  },
};

// The largest gap between matching numbers of two path `d` strings, or Infinity when their
// commands differ. Redoing a point move rebuilds the spline from the restored points, which can
// round a few coordinates 0.1px away from the drag's own render.
function pathGap(d: string | null, expected: string) {
  const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const commands = (path: string) => path.replace(/[-\d.,\s]+/g, '');
  if (d === null || commands(d) !== commands(expected)) {
    return Infinity;
  }
  const [actual, wanted] = [numbers(d), numbers(expected)];
  if (actual.length !== wanted.length) {
    return Infinity;
  }
  return Math.max(0, ...actual.map((n, i) => Math.abs(n - wanted[i])));
}

// Reads the contour's path once it has rendered in its final, closed shape.
async function settledPathD(page: Page, viewportPageObject: ViewportPageObject) {
  await waitForViewportsRendered(page);
  return getSvgAttribute({ viewportPageObject, svgInnerElement: 'path', attributeName: 'd' });
}

async function drawContour(page: Page, viewport: IViewportPageObject, tool: ContourTool) {
  await waitForAnnotationCompleted({ page, action: () => tool.draw(viewport) });
  await expect(viewport.svg('path'), 'Expected the contour to be drawn').toHaveCount(1);
  await expect(viewport.svg('path').first()).toBeVisible();
}

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, STUDY_UID, 'segmentation', 2000);
  await waitForViewportNotBlank({ page });

  const { contourSegmentationPanel } = rightPanelPageObject;
  await contourSegmentationPanel.addSegmentation();
  await expect(contourSegmentationPanel.panel.rows).toHaveCount(1);
  await waitForViewportsRendered(page);
});

// Draws one contour, then checks that one undo removes it with nothing left to undo, and that one
// redo brings back the same path.
async function undoRedoNewContour(
  tool: ContourTool,
  { page, mainToolbarPageObject, rightPanelPageObject, viewportPageObject }: ContourFixtures
) {
  const viewport = await viewportPageObject.active;
  const paths = viewport.svg('path');
  await expect(paths).toHaveCount(0);

  await tool.select(rightPanelPageObject);
  await drawContour(page, viewport, tool);
  const drawnPathD = await settledPathD(page, viewportPageObject);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });

  await mainToolbarPageObject.undo.click();
  await expect(paths, 'Expected undo to remove the contour').toHaveCount(0);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: true });

  await mainToolbarPageObject.redo.click();
  await expect(paths, 'Expected redo to restore the contour').toHaveCount(1);
  await expect(paths.first()).toBeVisible();
  await expect(paths.first()).toHaveAttribute('d', drawnPathD);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
}

test('should undo and redo a freehand contour', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  await undoRedoNewContour(FREEHAND_CONTOUR, {
    page,
    mainToolbarPageObject,
    rightPanelPageObject,
    viewportPageObject,
  });
});

// Expected to fail until https://github.com/OHIF/Viewers/issues/6368 is fixed.
test.fail(
  'should undo and redo a spline contour',
  async ({ page, mainToolbarPageObject, rightPanelPageObject, viewportPageObject }) => {
    await undoRedoNewContour(SPLINE_CONTOUR, {
      page,
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    });
  }
);

// Expected to fail until https://github.com/OHIF/Viewers/issues/6368 is fixed.
test.fail(
  'should undo and redo a livewire contour',
  async ({ page, mainToolbarPageObject, rightPanelPageObject, viewportPageObject }) => {
    await undoRedoNewContour(LIVEWIRE_CONTOUR, {
      page,
      mainToolbarPageObject,
      rightPanelPageObject,
      viewportPageObject,
    });
  }
);

test('should undo and redo a spline control point move', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const path = viewport.svg('path').first();

  await SPLINE_CONTOUR.select(rightPanelPageObject);
  await drawContour(page, viewport, SPLINE_CONTOUR);
  const drawnPathD = await settledPathD(page, viewportPageObject);

  await viewport.normalizedDragAt(SPLINE_POINT_MOVE);
  await expect(path, 'Expected the move to reshape the contour').not.toHaveAttribute(
    'd',
    drawnPathD
  );
  const movedPathD = await settledPathD(page, viewportPageObject);

  await mainToolbarPageObject.undo.click();
  await expect(path, 'Expected undo to restore the drawn shape').toHaveAttribute('d', drawnPathD);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: true });

  await mainToolbarPageObject.redo.click();
  await expect
    .poll(async () => pathGap(await path.getAttribute('d'), movedPathD), {
      message: 'Expected redo to move the point again',
    })
    .toBeLessThanOrEqual(0.5);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
});

test('should undo and redo a contour segment delete', async ({
  page,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const paths = viewport.svg('path');
  const { panel } = rightPanelPageObject.contourSegmentationPanel;

  await SPLINE_CONTOUR.select(rightPanelPageObject);
  await drawContour(page, viewport, SPLINE_CONTOUR);
  const drawnPathD = await settledPathD(page, viewportPageObject);
  const segmentName = await panel.nthSegment(0).title.innerText();

  await panel.nthSegment(0).actions.delete();
  await expect(panel.rows).toHaveCount(0);
  await expect(paths, 'Expected the delete to remove the contour').toHaveCount(0);

  await mainToolbarPageObject.undo.click();
  await expect(panel.rows, 'Expected undo to restore the segment row').toHaveCount(1);
  await expect(panel.nthSegment(0).title).toHaveText(segmentName);
  await expect(paths, 'Expected undo to restore the contour').toHaveCount(1);
  await expect(paths.first()).toHaveAttribute('d', drawnPathD);

  await mainToolbarPageObject.redo.click();
  await expect(panel.rows, 'Expected redo to delete the segment again').toHaveCount(0);
  await expect(paths, 'Expected redo to remove the contour again').toHaveCount(0);
});
