import { Locator } from 'playwright';

/**
 *
 * @parm locator - The locator to click on
 * @param points - The points to click on
 * @param button - The mouse button to use for the click (default is 'left').
 * @param delay - Milliseconds between mousedown and mouseup (default 100).
 * @returns Promise<void>
 */
export async function simulateClicksOnElement({
  locator,
  points,
  button = 'left',
  delay = 100,
}: {
  locator: Locator;
  points: { x: number; y: number }[];
  button?: 'left' | 'right' | 'middle';
  delay?: number;
}) {
  for (const { x, y } of points) {
    await locator.click({ delay, position: { x, y }, button });
  }
}

export async function simulateDoubleClickOnElement({
  locator,
  point,
  delay = 100,
}: {
  locator: Locator;
  point: { x: number; y: number };
  delay?: number;
}) {
  const { x, y } = point;
  await locator.dblclick({ delay, position: { x, y } });
}

/**
 * Simulates a double click on an element at a point normalized to the element's
 * @param locator - The locator to click on.
 * @param normalizedPoint - The point with x and y coordinates, normalized to the element's bounding box.
 * @param delay - Milliseconds between mousedown and mouseup of each click (default 100).
 */
export async function simulateNormalizedDoubleClickOnElement({
  locator,
  normalizedPoint,
  delay = 100,
}: {
  locator: Locator;
  normalizedPoint: { x: number; y: number };
  delay?: number;
}) {
  const bBox = await locator.boundingBox();
  const position = { x: normalizedPoint.x * bBox.width, y: normalizedPoint.y * bBox.height };
  await locator.dblclick({ delay, position });
}

/**
 * Simulates clicks on an element at a normalized point.
 *
 * @param locator - The locator to click on.
 * @param normalizedPoint - The point with x and y coordinates, normalized to the element's bounding box.
 * @param button - The mouse button to use for the click (default is 'left').
 * @param delay - Milliseconds between mousedown and mouseup (default 100).
 */
export async function simulateNormalizedClickOnElement({
  locator,
  normalizedPoint,
  button = 'left',
  delay = 100,
}: {
  locator: Locator;
  normalizedPoint: { x: number; y: number };
  button?: 'left' | 'right' | 'middle';
  delay?: number;
}) {
  const bBox = await locator.boundingBox();
  const position = { x: normalizedPoint.x * bBox.width, y: normalizedPoint.y * bBox.height };
  await locator.click({ delay, position, button });
}

/**
 * Simulates clicks on an element at normalized points.
 *
 * @param locator - The locator to click on.
 * @param normalizedPoints - An array of points with x and y coordinates, normalized to the element's bounding box.
 * @param button - The mouse button to use for the click (default is 'left').
 * @param delay - Milliseconds between mousedown and mouseup of each click (default 100).
 */
export async function simulateNormalizedClicksOnElement({
  locator,
  normalizedPoints,
  button = 'left',
  delay = 100,
}: {
  locator: Locator;
  normalizedPoints: { x: number; y: number }[];
  button?: 'left' | 'right' | 'middle';
  delay?: number;
}) {
  for (const normalizedPoint of normalizedPoints) {
    await simulateNormalizedClickOnElement({
      locator,
      normalizedPoint,
      button,
      delay,
    });
  }
}
