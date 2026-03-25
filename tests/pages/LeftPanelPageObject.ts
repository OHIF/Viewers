import { Page } from '@playwright/test';

const THUMBNAIL_ID_PREFIX = 'thumbnail-';

export class LeftPanelPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private async waitForLoad(displaySetInstanceUID: string, timeoutMs = 60_000) {
    await this.page.waitForFunction(
      ({ uid }) => {
        const services = (window as unknown as { services?: { displaySetService?: { getDisplaySetByUID: (id: string) => { load?: unknown; isLoaded?: boolean } } } }).services;
        if (!services?.displaySetService) {
          return false;
        }
        const ds = services.displaySetService.getDisplaySetByUID(uid);
        if (!ds) {
          return false;
        }
        if (typeof ds.load !== 'function') {
          return true;
        }
        return ds.isLoaded === true;
      },
      { uid: displaySetInstanceUID },
      { timeout: timeoutMs }
    );
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
    const thumbnailId = await matchingThumbnail.getAttribute('id');
    if (!thumbnailId?.startsWith(THUMBNAIL_ID_PREFIX)) {
      throw new Error(
        `Expected thumbnail id to start with "${THUMBNAIL_ID_PREFIX}", got: ${thumbnailId ?? '(missing)'}`
      );
    }
    const displaySetInstanceUID = thumbnailId.slice(THUMBNAIL_ID_PREFIX.length);
    await matchingThumbnail.dblclick();
    await this.waitForLoad(displaySetInstanceUID);
  }
}
