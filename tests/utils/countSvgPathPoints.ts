import type { Locator } from '@playwright/test';

// Matches any character that isn't an absolute M/L/Z command or part of a coordinate.
const UNSUPPORTED_PATH_CHARACTER = /[^MLZ\d\s.,-]/;

/**
 * Counts the vertices of an SVG path by counting its M and L commands, one per point
 * in Cornerstone's `drawPath` output. Throws if the path uses any other command, such
 * as a curve, since the count would be wrong. A path without a `d` counts as 0.
 * Pass it to `expect.poll` so the count retries.
 */
const countSvgPathPoints = async ({ path }: { path: Locator }): Promise<number> => {
  const d = (await path.getAttribute('d')) ?? '';
  if (UNSUPPORTED_PATH_CHARACTER.test(d)) {
    throw new Error(`Expected an absolute M/L/Z path, got: ${d.slice(0, 80)}`);
  }
  return (d.match(/[ML]/g) ?? []).length;
};

export { countSvgPathPoints };
