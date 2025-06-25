import { type Page, expect } from '@playwright/test';

/**
 * Defines the optional parameters for the addLengthMeasurement function.
 */
interface AddLengthMeasurementOptions {
  /** The [x, y] coordinates for the first click. Defaults to [150, 100]. */
  firstClick?: [number, number];
  /** The [x, y] coordinates for the second click. Defaults to [130, 170]. */
  secondClick?: [number, number];
}

/**
 * A reusable helper function to add a Length measurement to the viewport.
 * This encapsulates selecting the Length tool, verifying it's active,
 * and performing the two clicks required to draw the measurement.
 *
 * @param page - The Playwright page object.
 * @param options - Optional parameters for the measurement coordinates.
 */
export async function addLengthMeasurement(
  page: Page,
  options: AddLengthMeasurementOptions = {}
): Promise<void> {
  // Set default values for the click coordinates
  const { firstClick = [150, 100], secondClick = [130, 170] } = options;
  const [x1, y1] = firstClick;
  const [x2, y2] = secondClick;

  const lengthButton = page.getByTestId('MeasurementTools-split-button-primary');
  const viewport = page.locator('.cornerstone-viewport-element').first();

  // Assert that the primary measurement button is 'Length' tool
  await expect(lengthButton).toHaveAttribute('data-tool', 'Length');

  // Robustness check: only click the button if it's not already the active tool
  const isActive = await lengthButton.getAttribute('data-active');
  if (isActive !== 'true') {
    await lengthButton.click();
  }

  // Verify that the Length tool is now active before attempting to draw
  await expect(lengthButton).toHaveAttribute('data-active', 'true');

  // Perform the two clicks on the viewport canvas to draw the line
  await viewport.click({ position: { x: x1, y: y1 } });

  // Delay to allow canvas actions to finish/update
  await page.waitForTimeout(200);

  await viewport.click({ position: { x: x2, y: y2 } });
}
