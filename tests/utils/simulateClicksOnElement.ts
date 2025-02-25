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
}: {
  locator: Locator;
  points: { x: number; y: number }[];
}) {
  for (const { x, y } of points) {
    await locator.click({ delay: 100, position: { x, y } });
  }
}
