import { Page } from 'playwright-test-coverage';

export async function addOHIFConfiguration(page: Page, configToAdd: Record<string, unknown>) {
  await page.addInitScript(config => {
    let _config;
    Object.defineProperty(window, 'config', {
      get() {
        return _config;
      },
      set(value) {
        _config = {
          ...value,
          ...config,
        };
      },
      configurable: true,
    });
  }, configToAdd);
}
