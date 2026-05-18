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

  /**
   * Double-clicks a series whose DICOM Series Number matches the thumbnail’s
   * `data-series` attribute (and modality label). Thumbnail / sort order in the
   * study list does not affect which series is chosen.
   */
  async loadSeriesByModalityAndSeriesNumber(modality: string, seriesNumber: number) {
    const n = String(seriesNumber);
    const matchingThumbnail = this.page
      .locator(`[data-cy^="study-browser-thumbnail"][data-series="${n}"]`)
      .filter({
        has: this.page
          .getByTestId('series-modality-label')
          .getByText(modality, { exact: true }),
      });
    if ((await matchingThumbnail.count()) === 0) {
      throw new Error(
        `No study-browser thumbnail for modality "${modality}" and series number ${seriesNumber}`
      );
    }
    await matchingThumbnail.first().dblclick();
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
