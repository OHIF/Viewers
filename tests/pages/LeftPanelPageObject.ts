import { Locator, Page } from '@playwright/test';
import { ThumbnailPageObject } from './ThumbnailPageObject';

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

  /** Thumbnails of derived series - SEG, SR, RTSTRUCT - which show no image. */
  get derivedThumbnails() {
    return this.page.locator('[data-cy="study-browser-thumbnail-no-image"]');
  }

  /** Wraps a thumbnail locator so its contents can be read by name. */
  thumbnail(locator: Locator) {
    return new ThumbnailPageObject(this.page, locator);
  }

  thumbnailAt(nth: number = 0) {
    return this.thumbnail(this.thumbnails.nth(nth));
  }

  derivedThumbnailAt(nth: number = 0) {
    return this.thumbnail(this.derivedThumbnails.nth(nth));
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

  async loadSeriesBySeriesNumber(seriesNumber: string | number) {
    const matchingThumbnail = this.page.locator(
      `[data-cy^="study-browser-thumbnail"][data-series="${seriesNumber}"]`
    );
    await matchingThumbnail.dblclick();
  }
}
