import { Locator } from 'playwright';

/**
 * Simulates a continuous drag along a multi-point path on an element, using
 * coordinates normalized to the element's bounding box.
 *
 * mousedown fires at path[0]; the cursor smooth-moves through every subsequent
 * point in one stroke; mouseup fires at path[last] (unless mouseUp is false).
 *
 * @param locator - The locator to drag on.
 * @param path - Points (normalized to the element's bbox) describing the stroke.
 * @param button - The mouse button to use for the drag (default 'left').
 * @param delay - Milliseconds between intermediate moves (default 50).
 * @param steps - Number of intermediate positions per segment (default 10).
 * @param mouseUp - Whether to release the button at path[last] (default true).
 */
export async function simulateNormalizedPathDragOnElement({
  locator,
  path,
  button = 'left',
  delay = 50,
  steps = 10,
  mouseUp = true,
}: {
  locator: Locator;
  path: { x: number; y: number }[];
  button?: 'left' | 'right' | 'middle';
  delay?: number;
  steps?: number;
  mouseUp?: boolean;
}) {
  if (path.length < 2) {
    throw new Error('Path must contain at least 2 points');
  }

  const bBox = await locator.boundingBox();
  if (!bBox) {
    throw new Error('Element bounding box not found');
  }

  const page = locator.page();
  const absPath = path.map(p => ({
    x: bBox.x + p.x * bBox.width,
    y: bBox.y + p.y * bBox.height,
  }));

  await page.mouse.move(absPath[0].x, absPath[0].y);
  await page.mouse.down({ button });

  for (let segIdx = 1; segIdx < absPath.length; segIdx++) {
    const from = absPath[segIdx - 1];
    const to = absPath[segIdx];
    const deltaX = (to.x - from.x) / steps;
    const deltaY = (to.y - from.y) / steps;
    for (let i = 1; i <= steps; i++) {
      if (delay > 0) {
        await page.waitForTimeout(delay);
      }
      await page.mouse.move(from.x + deltaX * i, from.y + deltaY * i);
    }
  }

  if (mouseUp) {
    await page.mouse.up({ button });
  }
}

/**
 * Simulates a drag operation on an element using normalized coordinates.
 * Thin wrapper over simulateNormalizedPathDragOnElement with a 2-point path.
 *
 * @param locator - The locator to drag on.
 * @param start - The start point, normalized to the element's bounding box.
 * @param end - The end point, normalized to the element's bounding box.
 * @param button - The mouse button to use for the drag (default 'left').
 * @param delay - Milliseconds between steps (default 50).
 * @param steps - Number of intermediate positions for smooth dragging (default 10).
 */
export async function simulateNormalizedDragOnElement({
  locator,
  start,
  end,
  button = 'left',
  delay = 50,
  steps = 10,
  mouseUp = true,
}: {
  locator: Locator;
  start: { x: number; y: number };
  end: { x: number; y: number };
  button?: 'left' | 'right' | 'middle';
  delay?: number;
  steps?: number;
  mouseUp?: boolean;
}) {
  await simulateNormalizedPathDragOnElement({
    locator,
    path: [start, end],
    button,
    delay,
    steps,
    mouseUp,
  });
}
