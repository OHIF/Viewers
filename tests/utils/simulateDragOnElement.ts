import { Locator } from 'playwright';

/**
 * Simulates a drag operation on an element using normalized coordinates.
 *
 * @param locator - The locator to drag on.
 * @param start - The start point with x and y coordinates, normalized to the element's bounding box.
 * @param end - The end point with x and y coordinates, normalized to the element's bounding box.
 * @param button - The mouse button to use for the drag (default is 'left').
 * @param delay - Milliseconds between steps (default is 50).
 * @param steps - Number of intermediate positions for smooth dragging (default is 5).
 */
export async function simulateNormalizedDragOnElement({
  locator,
  start,
  end,
  button = 'left',
  delay = 50,
  steps = 10,
}: {
  locator: Locator;
  start: { x: number; y: number };
  end: { x: number; y: number };
  button?: 'left' | 'right' | 'middle';
  delay?: number;
  steps?: number;
}) {
  const bBox = await locator.boundingBox();
  if (!bBox) {
    throw new Error('Element bounding box not found');
  }

  const startPosition = {
    x: bBox.x + start.x * bBox.width,
    y: bBox.y + start.y * bBox.height,
  };
  const endPosition = {
    x: bBox.x + end.x * bBox.width,
    y: bBox.y + end.y * bBox.height,
  };

  // Get the page from the locator context
  const page = locator.page();

  page.mouse.move(startPosition.x, startPosition.y);

  // Start drag
  await page.mouse.down({ button });

  // Calculate intermediate positions for smooth dragging
  const deltaX = (endPosition.x - startPosition.x) / steps;
  const deltaY = (endPosition.y - startPosition.y) / steps;

  // Move through intermediate positions
  for (let i = 1; i <= steps; i++) {
    const currentX = startPosition.x + deltaX * i;
    const currentY = startPosition.y + deltaY * i;
    // Add delay if specified
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }
    await page.mouse.move(currentX, currentY);
  }

  // End drag
  await page.mouse.up({ button });
}
