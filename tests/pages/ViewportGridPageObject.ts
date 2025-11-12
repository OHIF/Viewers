import { Page, Locator } from '@playwright/test';

export class ViewportGridPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get activeViewport() {
    return this.page.locator('[data-cy="viewport-pane"][data-is-active="true"]');
  }

  get allViewportPanes() {
    return this.page.getByTestId('viewport-pane');
  }

  getNthViewportPane(index: number): Locator {
    return this.page.getByTestId('viewport-pane').nth(index);
  }

  getViewportById(viewportId: string): Locator {
    return this.page.locator(`css=div[data-viewportid="${viewportId}"]`);
  }

  get viewportGrid() {
    return this.page.getByTestId('viewport-grid');
  }
}
