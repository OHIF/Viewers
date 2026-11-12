import type { Locator, Page } from '@playwright/test';

import type { IViewportPageObject } from './pages/ViewportPageObject';
import type { RightPanelPageObject } from './pages';
import {
  expect,
  press,
  test,
  visitStudy,
  waitForAnnotationCompleted,
  waitForViewportNotBlank,
} from './utils';
import { expectUndoRedoEnabled } from './utils/assertions';

const STUDY_UID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

type Point = { x: number; y: number };

// Two horizontal lengths of different sizes, so each panel value names its line.
const LONG_LINE: [Point, Point] = [
  { x: 0.4, y: 0.35 },
  { x: 0.6, y: 0.35 },
];
const SHORT_LINE: [Point, Point] = [
  { x: 0.45, y: 0.6 },
  { x: 0.55, y: 0.6 },
];
const MOVED_LONG_LINE_END: Point = { x: 0.65, y: 0.45 };

function lengthValueAt(rightPanelPageObject: RightPanelPageObject, index: number) {
  const row = rightPanelPageObject.measurementsPanel.panel.nthMeasurement(index);
  return row.stats.primary.lines.first();
}

type LineEnd = { x2: string; y2: string };

async function lineEnd(line: Locator): Promise<LineEnd> {
  const x2 = await line.getAttribute('x2');
  const y2 = await line.getAttribute('y2');
  if (x2 === null || y2 === null) {
    throw new Error('Expected the length line to have an end point');
  }
  return { x2, y2 };
}

async function expectLineEnd(line: Locator, { x2, y2 }: LineEnd, message: string) {
  await expect(line, message).toHaveAttribute('x2', x2);
  await expect(line, message).toHaveAttribute('y2', y2);
}

// Reads the length value and line end once two reads 500ms apart agree, so a read right after a
// drag can't catch one of its intermediate steps.
async function settledLength(value: Locator, line: Locator) {
  let previous = '';
  await expect
    .poll(
      async () => {
        const current = JSON.stringify([await value.innerText(), await lineEnd(line)]);
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [500], message: 'Expected the length to stop changing' }
    )
    .toBe(true);
  const [settledValue, settledEnd] = JSON.parse(previous) as [string, LineEnd];
  return { value: settledValue, end: settledEnd };
}

// Expects one length annotation in the viewport per value, each showing its value.
async function expectViewportLengths(viewport: IViewportPageObject, values: string[]) {
  await expect(viewport.nthAnnotation(values.length).locator).toHaveCount(0);
  for (const value of values) {
    await expect(viewport.svg().getByText(value, { exact: true })).toHaveCount(1);
  }
}

async function drawLength(page: Page, viewport: IViewportPageObject, [start, end]: [Point, Point]) {
  await waitForAnnotationCompleted({
    page,
    action: () => viewport.normalizedClickAt([start, end]),
  });
}

test.beforeEach(
  async ({ page, mainToolbarPageObject, rightPanelPageObject, viewportPageObject }) => {
    await visitStudy(page, STUDY_UID, 'viewer', 2000);
    await waitForViewportNotBlank({ page });

    await rightPanelPageObject.toggle();
    await rightPanelPageObject.measurementsPanel.select();
    await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(0);
    const viewport = await viewportPageObject.active;
    await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
    await mainToolbarPageObject.measurementTools.length.click();
  }
);

test('should undo and redo a new measurement', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: false });

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const drawnValue = await lengthValueAt(rightPanelPageObject, 0).innerText();

  await mainToolbarPageObject.undo.click();
  await expect(rows, 'Expected undo to remove the measurement row').toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
  await expect(mainToolbarPageObject.undo.button).toBeDisabled();

  await mainToolbarPageObject.redo.click();
  await expect(rows, 'Expected redo to restore the measurement row').toHaveCount(1);
  await expect(viewport.nthAnnotation(0).locator).toBeVisible();
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(drawnValue);
  await expect(mainToolbarPageObject.redo.button).toBeDisabled();
});

test('should undo and redo a handle move', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const value = lengthValueAt(rightPanelPageObject, 0);
  const line = viewport.svg('line').first();

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
  const drawnValue = await value.innerText();
  const drawnEnd = await lineEnd(line);

  await viewport.normalizedDragAt({ start: LONG_LINE[1], end: MOVED_LONG_LINE_END });
  await expect(value, 'Expected the handle move to change the length').not.toHaveText(drawnValue);
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
  await expect(line, 'Expected the line end to move').not.toHaveAttribute('x2', drawnEnd.x2);
  const { value: movedValue, end: movedEnd } = await settledLength(value, line);

  await mainToolbarPageObject.undo.click();
  await expect(value, 'Expected undo to restore the drawn length').toHaveText(drawnValue);
  await expectLineEnd(line, drawnEnd, 'Expected undo to restore the line end');

  await mainToolbarPageObject.redo.click();
  await expect(value, 'Expected redo to reapply the moved length').toHaveText(movedValue);
  await expectLineEnd(line, movedEnd, 'Expected redo to move the line end again');
});

test('should undo and redo a measurement deleted from the panel', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const drawnValue = await lengthValueAt(rightPanelPageObject, 0).innerText();

  await rightPanelPageObject.measurementsPanel.panel.nthMeasurement(0).actions.delete();
  await expect(rows).toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);

  await mainToolbarPageObject.undo.click();
  await expect(rows, 'Expected undo to bring the deleted row back').toHaveCount(1);
  await expect(viewport.nthAnnotation(0).locator).toBeVisible();
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(drawnValue);

  await mainToolbarPageObject.redo.click();
  await expect(rows, 'Expected redo to delete the row again').toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
});

test('should undo measurements one at a time, newest first', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;
  const firstValue = lengthValueAt(rightPanelPageObject, 0);
  const secondValue = lengthValueAt(rightPanelPageObject, 1);

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const longValue = await firstValue.innerText();

  await drawLength(page, viewport, SHORT_LINE);
  await expect(rows).toHaveCount(2);
  await expect(secondValue).not.toHaveText(longValue);
  const shortValue = await secondValue.innerText();
  await expectViewportLengths(viewport, [longValue, shortValue]);

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(1);
  await expect(firstValue, 'Expected the newest to be undone first').toHaveText(longValue);
  await expectViewportLengths(viewport, [longValue]);

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(0);
  await expectViewportLengths(viewport, []);

  await mainToolbarPageObject.redo.click();
  await expect(rows).toHaveCount(1);
  await expect(firstValue, 'Expected the oldest to be redone first').toHaveText(longValue);
  await expectViewportLengths(viewport, [longValue]);

  await mainToolbarPageObject.redo.click();
  await expect(rows).toHaveCount(2);
  await expect(secondValue).toHaveText(shortValue);
  await expectViewportLengths(viewport, [longValue, shortValue]);
});

test('should drop the redo history when a new measurement is drawn after undo', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const longValue = await lengthValueAt(rightPanelPageObject, 0).innerText();
  await expectViewportLengths(viewport, [longValue]);

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(0);
  await expectViewportLengths(viewport, []);
  await expect(mainToolbarPageObject.redo.button).toBeEnabled();

  await drawLength(page, viewport, SHORT_LINE);
  await expect(rows).toHaveCount(1);
  await expect(lengthValueAt(rightPanelPageObject, 0)).not.toHaveText(longValue);
  const shortValue = await lengthValueAt(rightPanelPageObject, 0).innerText();
  await expectViewportLengths(viewport, [shortValue]);
  await expect(mainToolbarPageObject.redo.button, 'Expected redo to be cleared').toBeDisabled();

  // The redo hotkey must not bring back the undone measurement either.
  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(shortValue);
  await expectViewportLengths(viewport, [shortValue]);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
});

test('should undo and redo with Ctrl+Z and Ctrl+Y like the header buttons', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const drawnValue = await lengthValueAt(rightPanelPageObject, 0).innerText();

  await press({ page, key: 'Control+z' });
  await expect(rows, 'Expected Ctrl+Z to remove the measurement row').toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: true });

  await press({ page, key: 'Control+y' });
  await expect(rows, 'Expected Ctrl+Y to restore the measurement row').toHaveCount(1);
  await expect(viewport.nthAnnotation(0).locator).toBeVisible();
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(drawnValue);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
});

test('should ignore Ctrl+Z and Ctrl+Y when there is nothing to undo or redo', async ({
  page,
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;
  const value = lengthValueAt(rightPanelPageObject, 0);

  // Nothing has been drawn yet, so both shortcuts are no-ops.
  await press({ page, key: 'Control+z' });
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: false });
  await press({ page, key: 'Control+y' });
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: false });
  await expect(rows).toHaveCount(0);

  await drawLength(page, viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
  const drawnValue = await value.innerText();

  await press({ page, key: 'Control+z' });
  await expect(rows).toHaveCount(0);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: true });

  // The undo stack is empty again, so this press must not consume the redo entry.
  await press({ page, key: 'Control+z' });
  await expect(rows).toHaveCount(0);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: false, redo: true });

  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(value).toHaveText(drawnValue);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });

  // The redo stack is empty now, so another press leaves the measurement as is.
  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(value).toHaveText(drawnValue);
  await expectUndoRedoEnabled({ mainToolbarPageObject, undo: true, redo: false });
});
