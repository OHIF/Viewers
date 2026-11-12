import type { Page } from '@playwright/test';

/**
 * Rounds measured values with the viewer's own `roundNumber`, the way the stats card and the
 * measurement labels show them, such as '152', '77.0' or '0.312'. An array value, such as a
 * point, is rounded per coordinate and joined with ', '.
 */
export async function roundNumbers(page: Page, values: unknown[]): Promise<string[]> {
  return page.evaluate(
    values => values.map(value => (window as any).cornerstone.utilities.roundNumber(value)),
    values
  );
}
