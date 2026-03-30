import { Page } from '@playwright/test';

export class DataOverlayPageObject {
  readonly page: Page;
  readonly viewportId: string;

  constructor(page: Page, viewportId: string) {
    this.page = page;
    this.viewportId = viewportId;
  }

  async toggle() {
    await this.page.getByTestId(`dataOverlayMenu-${this.viewportId}-btn`).click();
  }

  async addSegmentation(segmentation: string) {
    await this.page.getByTestId(`AddSegmentationDataOverlay-${this.viewportId}`).click();
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

  async openAddSegmentationDropdown(viewportId: string = 'default') {
    await this.page.getByTestId(`AddSegmentationDataOverlay-${viewportId}`).click();
    await this.page.getByText('SELECT A SEGMENTATION').click();
  }

  async getDropdownOptionLabels(): Promise<string[]> {
    const options = this.page.getByRole('option');
    const labels = (await options.allTextContents()).map(text => text.trim()).filter(Boolean);
    return labels;
  }

  getOverlaySegmentationRow(label: string) {
    const locator = this.page.getByTestId(`overlay-ds-select-value-${label.toUpperCase()}`);
    return locator;
  }

  async changeBackgroundDisplaySet(backgroundLabel: string, viewportId: string = 'default') {
    await this.page.getByTestId(`overlay-background-ds-select-${viewportId}`).click();
    await this.page.getByTestId(backgroundLabel).click();
  }
}
