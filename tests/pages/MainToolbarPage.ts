import { Page, Locator } from '@playwright/test';

export class MainToolbarPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get panTool() {
    return {
      button: this.page.getByTestId('Pan'),
      async click() {
        await this.page.getByTestId('Pan').click();
      },
    };
  }

  get layout() {
    const page = this.page;
    return {
      button: page.getByTestId('Layout'),
      async click() {
        await page.getByTestId('Layout').click();
      },
      get threeDFourUp() {
        return {
          button: page.getByTestId('3D four up'),
          async click() {
            await page.getByTestId('Layout').click();
            await page.getByTestId('3D four up').click();
          },
        };
      },
    };
  }

  get moreTools() {
    const page = this.page;
    return {
      button: page.getByTestId('MoreTools-split-button-secondary'),
      async click() {
        await page.getByTestId('MoreTools-split-button-secondary').click();
      },
      get angle() {
        return {
          button: page.getByTestId('Angle'),
          async click() {
            await page.getByTestId('MoreTools-split-button-secondary').click();
            await page.getByTestId('Angle').click();
          },
        };
      },
    };
  }
}
