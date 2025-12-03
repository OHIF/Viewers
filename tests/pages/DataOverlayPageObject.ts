import { Page } from '@playwright/test';

export class DataOverlayPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get button() {
    return this.page.locator('[data-cy^="dataOverlayMenu"]').first();
  }

  async toggle() {
    await this.button.click();
  }

  async addSegmentation(segmentation: string) {
    await this.page.getByTestId('AddSegmentationDataOverlay-default').click();
    await this.page.getByText('SELECT A SEGMENTATION').click();
    await this.page.getByTestId(segmentation).click();
  }

  async changeSegmentation(from: string, to: string) {
    await this.page.getByTestId(`overlay-ds-select-value-${from.toUpperCase()}`).click();
    await this.page.getByTestId(`${to}-SEG`).click();
  }

  async remove() {
    await this.page.getByTestId('overlay-ds-more-button-SEGMENTATION').click();
    await this.page.getByTestId('overlay-ds-remove-button-SEGMENTATION').click();
  }
}
