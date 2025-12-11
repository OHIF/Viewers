import { Page } from '@playwright/test';

export class DataOverlayPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async toggle(viewportId: string = 'default') {
    await this.page.getByTestId(`dataOverlayMenu-${viewportId}-btn`).click();
  }

  async addSegmentation(segmentation: string, viewportId: string = 'default') {
    await this.page.getByTestId(`AddSegmentationDataOverlay-${viewportId}`).click();
    await this.page.getByText('SELECT A SEGMENTATION').click();
    await this.page.getByTestId(segmentation).click();
  }

  async changeSegmentation(from: string, to: string) {
    await this.page.getByTestId(`overlay-ds-select-value-${from.toUpperCase()}`).click();
    await this.page.getByTestId(`${to}-SEG`).click();
  }

  async remove(segmentation: string) {
    await this.page.getByTestId(`overlay-ds-more-button-${segmentation}`).click();
    await this.page.getByTestId(`overlay-ds-remove-button-${segmentation}`).click();
  }
}
