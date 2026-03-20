import { Page } from '@playwright/test';
import { CLICK_NO_NAV_WAIT } from '../utils/clickOptions';

export class DataOverlayPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async toggle(viewportId: string = 'default') {
    await this.page.getByTestId(`dataOverlayMenu-${viewportId}-btn`).click(CLICK_NO_NAV_WAIT);
  }

  async addSegmentation(segmentation: string, viewportId: string = 'default') {
    await this.page.getByTestId(`AddSegmentationDataOverlay-${viewportId}`).click(CLICK_NO_NAV_WAIT);
    await this.page.getByText('SELECT A SEGMENTATION').click(CLICK_NO_NAV_WAIT);
    await this.page.getByTestId(segmentation).click(CLICK_NO_NAV_WAIT);
  }

  async changeSegmentation(from: string, to: string) {
    await this.page.getByTestId(`overlay-ds-select-value-${from.toUpperCase()}`).click(CLICK_NO_NAV_WAIT);
    await this.page.getByTestId(`${to}-SEG`).click(CLICK_NO_NAV_WAIT);
  }

  async remove(segmentation: string) {
    await this.page.getByTestId(`overlay-ds-more-button-${segmentation}`).click(CLICK_NO_NAV_WAIT);
    await this.page.getByTestId(`overlay-ds-remove-button-${segmentation}`).click(CLICK_NO_NAV_WAIT);
  }
}
