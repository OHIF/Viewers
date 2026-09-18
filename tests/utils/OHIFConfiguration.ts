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

export async function addOHIFConfiguration(page: Page, configToAdd: Record<string, unknown>) {
  const customizationSetters = Object.fromEntries(
    Object.entries(DEFAULT_E2E_OHIF_CUSTOMIZATIONS || {}).map(([key, value]) => [
      key,
      { $set: value },
    ])
  );

  const baselinePlusConfigToAdd = {
    ...DEFAULT_E2E_OHIF_CONFIGURATION,
    customizationService: [customizationSetters],
    ...configToAdd,
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
