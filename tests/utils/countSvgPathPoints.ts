import type { Locator } from '@playwright/test';

// Matches each number in a path `d` attribute, including negative, decimal, and exponent forms.
const SVG_PATH_NUMBER_PATTERN = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

/**
 * Counts the vertices of an SVG path by counting the coordinate pairs in its `d`
 * attribute. Assumes absolute M/L/Z commands, which is how contour outlines render.
 * A path without a `d` counts as 0. Pass it to `expect.poll` so the count retries.
 */
const countSvgPathPoints = async ({ path }: { path: Locator }): Promise<number> => {
  const d = (await path.getAttribute('d')) ?? '';
  const numbers = d.match(SVG_PATH_NUMBER_PATTERN) ?? [];
  return Math.floor(numbers.length / 2);
};

export { countSvgPathPoints };
