import type { Page } from '@playwright/test';

// Global per-test configuration skeleton.
// Keep this empty by default and add top-level window.config overrides here when needed.
export const DEFAULT_E2E_OHIF_CONFIGURATION: Record<string, unknown> = {};

// Global per-test customization baseline.
export const DEFAULT_E2E_OHIF_CUSTOMIZATIONS: Record<string, unknown> = {
  'viewportScrollbar.showViewedFill': false,
  'viewportScrollbar.showLoadingPattern': false,
  'viewportScrollbar.showLoadedFill': false,
  'viewportScrollbar.showLoadedEndpoints': false,
};

// What each page has been given so far. A later call replaces the `window.config` setter
// of an earlier one, so each call applies the earlier config again with its own.
const configurationByPage = new WeakMap<Page, Record<string, unknown>>();

export async function addOHIFConfiguration(page: Page, configToAdd: Record<string, unknown>) {
  const configForPage = { ...configurationByPage.get(page), ...configToAdd };
  configurationByPage.set(page, configForPage);

  const customizationSetters = Object.fromEntries(
    Object.entries(DEFAULT_E2E_OHIF_CUSTOMIZATIONS || {}).map(([key, value]) => [
      key,
      { $set: value },
    ])
  );

  const baselinePlusConfigToAdd = {
    ...DEFAULT_E2E_OHIF_CONFIGURATION,
    customizationService: [customizationSetters],
    ...configForPage,
  };

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
  }, baselinePlusConfigToAdd);
}

export async function addOHIFGlobalCustomizations(
  page: Page,
  customizationsToAdd: Record<string, unknown>
) {
  await page.evaluate(customizations => {
    const customizationService = (window as any).services?.customizationService;
    if (!customizationService?.setGlobalCustomization) {
      return;
    }

    Object.entries(customizations || {}).forEach(([key, value]) => {
      customizationService.setGlobalCustomization(key, value);
    });
  }, customizationsToAdd);
}
