import { Page, Locator } from '@playwright/test';

export class ViewportGridPage {
  readonly page: Page;
  readonly viewportGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.viewportGrid = page.getByTestId('viewport-grid');
  }

  getViewportGrid(): Locator {
    return this.page.getByTestId('viewport-grid');
  }

  getAllViewportPanes(): Locator {
    return this.page.getByTestId('viewport-pane');
  }

  getNthViewportPane(index: number): Locator {
    return this.page.getByTestId('viewport-pane').nth(index);
  }

  getActiveViewport(): Locator {
    return this.page.locator('[data-cy="viewport-pane"][data-is-active="true"]');
  }
}
