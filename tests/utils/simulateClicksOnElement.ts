import { Locator } from 'playwright';

/**
 *
 * @parm locator - The locator to click on
 * @param points - The points to click on
 * @returns Promise<void>
 */
export async function simulateClicksOnElement({
  locator,
  points,
  button = 'left',
}: {
  locator: Locator;
  points: { x: number; y: number }[];
  button?: 'left' | 'right' | 'middle';
}) {
  for (const { x, y } of points) {
    await locator.click({ delay: 100, position: { x, y }, button });
  }
}

export async function simulateDoubleClickOnElement({
  locator,
  point,
}: {
  locator: Locator;
  point: { x: number; y: number };
}) {
  const { x, y } = point;
  await locator.dblclick({ delay: 100, position: { x, y } });
}

/**
 * Simulates clicks on an element at a normalized point.
 *
 * @param locator - The locator to click on.
 * @param normalizedPoint - The point with x and y coordinates, normalized to the element's bounding box.
 * @param button - The mouse button to use for the click (default is 'left').
 */
export async function simulateNormalizedClickOnElement({
  locator,
  normalizedPoint,
  button = 'left',
}: {
  locator: Locator;
  normalizedPoint: { x: number; y: number };
  button?: 'left' | 'right' | 'middle';
}) {
  const bBox = await locator.boundingBox();
  const position = { x: normalizedPoint.x * bBox.width, y: normalizedPoint.y * bBox.height };
  await locator.click({ delay: 100, position, button });
}

/**
 * Simulates clicks on an element at normalized points.
 *
 * @param locator - The locator to click on.
 * @param normalizedPoints - An array of points with x and y coordinates, normalized to the element's bounding box.
 * @param button - The mouse button to use for the click (default is 'left').
 */
export async function simulateNormalizedClicksOnElement({
  locator,
  normalizedPoints,
  button = 'left',
}: {
  locator: Locator;
  normalizedPoints: { x: number; y: number }[];
  button?: 'left' | 'right' | 'middle';
}) {
  for (const normalizedPoint of normalizedPoints) {
    await simulateNormalizedClickOnElement({
      locator,
      normalizedPoint,
      button,
    });
  }
}
