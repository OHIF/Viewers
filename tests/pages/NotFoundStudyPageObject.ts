import { Locator, Page } from '@playwright/test';

export class NotFoundStudyPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-cy="study-not-found-message"]');
  }

  get returnMessage(): Locator {
    return this.page.locator('[data-cy="return-to-study-list-message"]');
  }

  get studyListLink(): Locator {
    return this.page.getByRole('link', { name: 'study list' });
  }
}
