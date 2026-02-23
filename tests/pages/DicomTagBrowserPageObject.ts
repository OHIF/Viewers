import { Page } from '@playwright/test';

export class DicomTagBrowserPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitVisible() {
    const locator = this.page.locator('[role="dialog"]').filter({
      has: this.page.getByTestId('dicom-tag-series-select-trigger'),
    });
    await locator.waitFor({ state: 'visible' });
  }

  get seriesSelect() {
    const page = this.page;
    const trigger = page.getByTestId('dicom-tag-series-select-trigger');
    const value = page.getByTestId('dicom-tag-series-select-value');
    const options = page.getByRole('option');

    return {
      trigger,
      value,
      options,

      async click() {
        await trigger.click();
      },

      async selectOption(index) {
        await this.click();
        const optionText = await options.nth(index).innerText();
        const selectedText = optionText.split('\n')[0].trim();

        await options.nth(index).click();

        return selectedText;
      },
    };
  }
}
