import { Page, Locator } from '@playwright/test';

export class ViewportGridPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get activeViewport(): Locator {
    return this.page.locator('[data-cy="viewport-pane"][data-is-active="true"]');
  }

  get allViewports(): Locator {
    return this.page.getByTestId('viewport-pane');
  }

  getNthViewport(index: number): Locator {
    return this.page.getByTestId('viewport-pane').nth(index);
  }

  getViewportById(viewportId: string): Locator {
    return this.page.locator(`css=div[data-viewportid="${viewportId}"]`);
  }

  get viewportGrid(): Locator {
    return this.page.getByTestId('viewport-grid');
  }
}
