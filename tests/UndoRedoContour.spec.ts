import type { Locator, Page } from '@playwright/test';

import type { MainToolbarPageObject, RightPanelPageObject, ViewportPageObject } from './pages';
import type { IViewportPageObject } from './pages/ViewportPageObject';
import {
  expect,
  test,
  visitStudy,
  waitForAnnotationCompleted,
  waitForViewportNotBlank,
  waitForViewportsRendered,
} from './utils';
import { expectUndoRedoState } from './utils/assertions';

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
  draw: viewport => viewport.normalizedPathClickAt({ path: SPLINE_POINTS, closePath: true }),
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

// Largest coordinate difference between two path `d` strings with the same commands; Infinity
// otherwise.
function maxCoordinateDiff(d: string | null, expected: string) {
  const numbers = (path: string) => (path.match(/-?(\d*\.)?\d+(e[-+]?\d+)?/gi) ?? []).map(Number);
  const commands = (path: string) => path.replace(/[-+\d.,\se]+/gi, '');
  if (d === null || commands(d) !== commands(expected)) {
    return Infinity;
  }
  const [actual, wanted] = [numbers(d), numbers(expected)];
  if (actual.length !== wanted.length) {
    return Infinity;
  }
  return Math.max(0, ...actual.map((n, i) => Math.abs(n - wanted[i])));
}

// Undo and redo rebuild the spline from its restored points, which can round a few coordinates
// slightly differently from the render they restore, so allow half a pixel.
function pollPathNear(path: Locator, expected: string, message: string) {
  return expect
    .poll(async () => maxCoordinateDiff(await path.getAttribute('d'), expected), { message })
    .toBeLessThanOrEqual(0.5);
}

// Reads the path's `d` once two reads 250ms apart agree.
async function settledPathD(path: Locator) {
  let previous: string | null = null;
  await expect
    .poll(
      async () => {
        const d = await path.getAttribute('d');
        const settled = d !== null && d === previous;
        previous = d;
        return settled;
      },
      { intervals: [250], message: 'Expected the contour path to stop changing' }
    )
    .toBe(true);
  return previous as string;
}

async function drawContour(page: Page, viewport: IViewportPageObject, tool: ContourTool) {
  await waitForAnnotationCompleted({ page, action: () => tool.draw(viewport) });
  await expect(viewport.svg('path'), 'Expected the contour to be drawn').toHaveCount(1);
  await expect(viewport.svg('path').first()).toBeVisible();
}

test.beforeEach(async ({ page, rightPanelPageObject }) => {
  await visitStudy(page, STUDY_UID, 'segmentation', 2000);
  // Livewire snaps to the image's edges, so draw only once the image is on screen.
  await waitForViewportNotBlank({ page });

  const { contourSegmentationPanel } = rightPanelPageObject;
  await contourSegmentationPanel.addSegmentation();
  await expect(contourSegmentationPanel.panel.rows).toHaveCount(1);
  // Adding a segmentation re-renders the viewport; draw once that render is done.
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
  const drawnPathD = await settledPathD(paths.first());
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

  await mainToolbarPageObject.undo.click();
  await expect(paths, 'Expected undo to remove the contour').toHaveCount(0);
  await expectUndoRedoState({ mainToolbarPageObject, undo: false, redo: true });

  await mainToolbarPageObject.redo.click();
  await expect(paths, 'Expected redo to restore the contour').toHaveCount(1);
  await expect(paths.first()).toBeVisible();
  await expect(paths.first()).toHaveAttribute('d', drawnPathD);
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
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
  const drawnPathD = await settledPathD(path);

  await viewport.normalizedDragAt(SPLINE_POINT_MOVE);
  await expect(path, 'Expected the move to reshape it').not.toHaveAttribute('d', drawnPathD);
  const movedPathD = await settledPathD(path);
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

  await mainToolbarPageObject.undo.click();
  await pollPathNear(path, drawnPathD, 'Expected undo to restore the drawn shape');
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: true });

  await mainToolbarPageObject.redo.click();
  await pollPathNear(path, movedPathD, 'Expected redo to move the point again');
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
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
  const drawnPathD = await settledPathD(paths.first());
  const segmentName = await panel.nthSegment(0).title.innerText();

  await panel.nthSegment(0).actions.delete();
  await expect(panel.rows).toHaveCount(0);
  await expect(paths, 'Expected the delete to remove the contour').toHaveCount(0);
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });

  await mainToolbarPageObject.undo.click();
  await expect(panel.rows, 'Expected undo to restore the segment row').toHaveCount(1);
  await expect(panel.nthSegment(0).title).toHaveText(segmentName);
  await expect(paths, 'Expected undo to restore the contour').toHaveCount(1);
  await expect(paths.first()).toBeVisible();
  await expect(paths.first()).toHaveAttribute('d', drawnPathD);
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: true });

  await mainToolbarPageObject.redo.click();
  await expect(panel.rows, 'Expected redo to delete the segment again').toHaveCount(0);
  await expect(paths, 'Expected redo to remove the contour again').toHaveCount(0);
  await expectUndoRedoState({ mainToolbarPageObject, undo: true, redo: false });
});
