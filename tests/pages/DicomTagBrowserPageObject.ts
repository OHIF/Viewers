import { Page } from '@playwright/test';

export class DicomTagBrowserPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get dialog() {
    return this.page.locator('[role="dialog"]');
  }

  get seriesSelect() {
    const page = this.page;
    const button = page.getByTestId('dicom-tag-series-select-trigger');

    return {
      button,

      async click() {
        await button.click();
      },

      get value() {
        return page.getByTestId('dicom-tag-series-select-value');
      },

      get options() {
        return page.locator('[role="option"]');
      },
    };
  }
}
