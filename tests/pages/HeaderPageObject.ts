import type { Page } from '@playwright/test';

export class HeaderPageObject {
  constructor(private readonly page: Page) {}

  get locator() {
    return this.page.getByTestId('app-header');
  }

  get branding() {
    return this.page.getByTestId('app-header-branding');
  }

  get toolbar() {
    return this.page.getByTestId('app-header-toolbar');
  }

  get firstToolbarSection() {
    return this.toolbar.locator(':scope > :first-child');
  }

  get actions() {
    return this.page.getByTestId('app-header-actions');
  }

  get contextActions() {
    return this.page.getByTestId('app-header-context-actions');
  }
}
