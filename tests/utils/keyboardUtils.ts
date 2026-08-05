import { Page } from '@playwright/test';

/**
 * PressParams defines the parameters for the press function.
 * @property {Page} page - The Playwright page on which to perform the key press.
 * @property {string} key - The key to be pressed.
 * @property {number} [nTimes=1] - The number of times to press the key (default is 1).
 * @property {unknown} [options={}] - Additional options for the key press.
 */
type PressParams = {
  page: Page;
  key: string;
  nTimes?: number;
  options?: unknown;
};

/**
 * Convenience function to press a key multiple times on a Playwright page.
 */
export const press = async (params: PressParams) => {
  const { page, key, nTimes = 1, options = {} } = params;

  for (let i = 0; i < nTimes; i += 1) {
    await page.keyboard.press(key, options);
  }
};

/**
 * Holds a key down until a matching keyUp. Held modifier keys (e.g. 'Shift')
 * apply to the mouse events performed while the key is down.
 */
export const keyDown = async ({ page, key }: { page: Page; key: string }) => {
  await page.keyboard.down(key);
};

/**
 * Releases a key previously held via keyDown.
 */
export const keyUp = async ({ page, key }: { page: Page; key: string }) => {
  await page.keyboard.up(key);
};
