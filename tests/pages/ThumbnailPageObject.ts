import { Locator, Page } from '@playwright/test';

/**
 * One thumbnail in the study browser.  Obtained from
 * {@link LeftPanelPageObject.thumbnail} rather than constructed directly, so
 * that the `data-cy` hooks a thumbnail exposes are named in one place.
 */
export class ThumbnailPageObject {
  readonly page: Page;
  /** The thumbnail's root element. */
  readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }

  /** Every item of the detail line under the description, in display order. */
  get details() {
    return this.root.locator('[data-cy^="thumbnail-detail-"]');
  }

  /** One detail item by the id its customization declares, e.g. `SeriesNumber`. */
  detail(id: string) {
    return this.root.locator(`[data-cy="thumbnail-detail-${id}"]`);
  }

  /**
   * The ids of the detail items, in display order - what the
   * `studyBrowser.thumbnailDetails` customization resolved to.
   */
  async detailIds(): Promise<string[]> {
    return this.details.evaluateAll(elements =>
      elements.map(element => element.getAttribute('data-cy')?.replace('thumbnail-detail-', ''))
    );
  }

  get seriesNumber() {
    return this.detail('SeriesNumber');
  }

  get instanceCount() {
    return this.detail('InstanceCount');
  }

  /**
   * The creation date/time item, which only the `studyBrowser/derivedDateTime`
   * customization adds.
   */
  get instanceDateTime() {
    return this.detail('InstanceDateTime');
  }

  get modality() {
    return this.root.locator('[data-cy="series-modality-label"]');
  }

  get description() {
    return this.root.locator('[data-cy="series-description-label"]');
  }

  async load() {
    await this.root.dblclick();
  }
}
