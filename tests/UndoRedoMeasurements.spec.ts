import type { Locator } from '@playwright/test';

import type { IViewportPageObject } from './pages/ViewportPageObject';
import type { RightPanelPageObject } from './pages';
import { expect, press, test, visitStudy, waitForViewportPainted } from './utils';

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

async function drawLength(viewport: IViewportPageObject, [start, end]: [Point, Point]) {
  await viewport.normalizedClickAt([start]);
  // Hold the closing click past Cornerstone's 400ms double-click window, so the line is
  // finished when the click returns and an undo right after it can't race the tool.
  await viewport.normalizedClickAt([end], 'left', 500);
}

test.beforeEach(async ({ page, mainToolbarPageObject, rightPanelPageObject }) => {
  await visitStudy(page, STUDY_UID, 'viewer', 2000);
  await waitForViewportPainted({ page });

  await rightPanelPageObject.toggle();
  await rightPanelPageObject.measurementsPanel.select();
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(0);
  await mainToolbarPageObject.measurementTools.length.click();
});

test('should undo and redo a new measurement', async ({
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await expect(mainToolbarPageObject.undo.button).toBeDisabled();
  await expect(mainToolbarPageObject.redo.button).toBeDisabled();

  await drawLength(viewport, LONG_LINE);
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
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const value = lengthValueAt(rightPanelPageObject, 0);
  const line = viewport.svg('line').first();

  await drawLength(viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
  const drawnValue = await value.innerText();
  const drawnEnd = await lineEnd(line);

  await viewport.normalizedDragAt({ start: LONG_LINE[1], end: MOVED_LONG_LINE_END });
  await expect(value, 'Expected the handle move to change the length').not.toHaveText(drawnValue);
  await expect(rightPanelPageObject.measurementsPanel.panel.rows).toHaveCount(1);
  await expect(line, 'Expected the handle move to move the line end').not.toHaveAttribute(
    'x2',
    drawnEnd.x2
  );
  const movedValue = await value.innerText();
  const movedEnd = await lineEnd(line);

  await mainToolbarPageObject.undo.click();
  await expect(value, 'Expected undo to restore the drawn length').toHaveText(drawnValue);
  await expectLineEnd(line, drawnEnd, 'Expected undo to restore the line end');

  await mainToolbarPageObject.redo.click();
  await expect(value, 'Expected redo to reapply the moved length').toHaveText(movedValue);
  await expectLineEnd(line, movedEnd, 'Expected redo to move the line end again');
});

test('should undo and redo a measurement deleted from the panel', async ({
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;

  await drawLength(viewport, LONG_LINE);
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
  DOMOverlayPageObject,
  mainToolbarPageObject,
  rightPanelPageObject,
  viewportPageObject,
}) => {
  const viewport = await viewportPageObject.active;
  const { rows } = rightPanelPageObject.measurementsPanel.panel;
  const firstValue = lengthValueAt(rightPanelPageObject, 0);
  const secondValue = lengthValueAt(rightPanelPageObject, 1);

  await drawLength(viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const longValue = await firstValue.innerText();

  await drawLength(viewport, SHORT_LINE);
  await expect(rows).toHaveCount(2);
  await expect(secondValue).not.toHaveText(longValue);
  const shortValue = await secondValue.innerText();

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(1);
  await expect(firstValue, 'Expected the newest to be undone first').toHaveText(longValue);

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(0);

  await mainToolbarPageObject.redo.click();
  await expect(rows).toHaveCount(1);
  await expect(firstValue, 'Expected the oldest to be redone first').toHaveText(longValue);

  await mainToolbarPageObject.redo.click();
  await expect(rows).toHaveCount(2);
  await expect(secondValue).toHaveText(shortValue);
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

  await drawLength(viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const longValue = await lengthValueAt(rightPanelPageObject, 0).innerText();

  await mainToolbarPageObject.undo.click();
  await expect(rows).toHaveCount(0);
  await expect(mainToolbarPageObject.redo.button).toBeEnabled();

  await drawLength(viewport, SHORT_LINE);
  await expect(rows).toHaveCount(1);
  await expect(lengthValueAt(rightPanelPageObject, 0)).not.toHaveText(longValue);
  const shortValue = await lengthValueAt(rightPanelPageObject, 0).innerText();
  await expect(mainToolbarPageObject.redo.button, 'Expected redo to be cleared').toBeDisabled();

  // The redo hotkey must not bring back the undone measurement either.
  await press({ page, key: 'Control+y' });
  await expect(rows).toHaveCount(1);
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(shortValue);
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

  await drawLength(viewport, LONG_LINE);
  await DOMOverlayPageObject.viewport.measurementTracking.confirm.click();
  await expect(rows).toHaveCount(1);
  const drawnValue = await lengthValueAt(rightPanelPageObject, 0).innerText();

  await press({ page, key: 'Control+z' });
  await expect(rows, 'Expected Ctrl+Z to remove the measurement row').toHaveCount(0);
  await expect(viewport.nthAnnotation(0).locator).toHaveCount(0);
  await expect(mainToolbarPageObject.undo.button).toBeDisabled();
  await expect(mainToolbarPageObject.redo.button).toBeEnabled();

  await press({ page, key: 'Control+y' });
  await expect(rows, 'Expected Ctrl+Y to restore the measurement row').toHaveCount(1);
  await expect(viewport.nthAnnotation(0).locator).toBeVisible();
  await expect(lengthValueAt(rightPanelPageObject, 0)).toHaveText(drawnValue);
  await expect(mainToolbarPageObject.undo.button).toBeEnabled();
  await expect(mainToolbarPageObject.redo.button).toBeDisabled();
});
