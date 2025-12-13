import { Page } from '@playwright/test';

export class LeftPanelPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async toggle() {
    await this.page.getByTestId('side-panel-header-left').click();
  }

  get thumbnails() {
    return this.page.locator('[data-cy^="study-browser-thumbnail"]');
  }

  async loadSeriesByModality(modality: string, nth: number = 0) {
    const matchingThumbnail = this.thumbnails
      .filter({
        has: this.page.locator('[data-cy="series-modality-label"]', { hasText: modality }),
      })
      .nth(nth);
    await matchingThumbnail.dblclick();
  }

  async loadSeriesByDescription(description: string, nth: number = 0) {
    const matchingThumbnail = this.thumbnails
      .filter({
        has: this.page.locator('[data-cy="series-description-label"]', { hasText: description }),
      })
      .nth(nth);
    await matchingThumbnail.dblclick();
  }
}
