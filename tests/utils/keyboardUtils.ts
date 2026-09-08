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
 * WithKeyHeldParams defines the parameters for the withKeyHeld function.
 * @property {Page} page - The Playwright page on which to hold the key.
 * @property {string} key - The key to hold for the duration of the action.
 * @property {() => Promise<void>} action - The steps to perform while the key is held.
 */
type WithKeyHeldParams = {
  page: Page;
  key: string;
  action: () => Promise<void>;
};

/**
 * Runs an action with a key held down, releasing it afterwards even if the action
 * throws. A held modifier (e.g. 'Shift') applies to the mouse events the action
 * performs, which is how modifier-dependent tools are driven from a test.
 */
export const withKeyHeld = async ({ page, key, action }: WithKeyHeldParams) => {
  await page.keyboard.down(key);
  try {
    await action();
  } finally {
    await page.keyboard.up(key);
  }
};
