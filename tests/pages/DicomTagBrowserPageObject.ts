import { Page } from '@playwright/test';
import { CLICK_NO_NAV_WAIT } from '../utils/clickOptions';

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

      async getOptionText(index) {
        await this.click();
        const optionText = await options.nth(index).innerText();
        const trimmedOptionText = optionText.split('\n')[0].trim();
        return trimmedOptionText;
      },

      async selectOption(index) {
        const selectedText = await this.getOptionText(index);
        await options.nth(index).click(CLICK_NO_NAV_WAIT);
        return selectedText;
      },
    };
  }
}
