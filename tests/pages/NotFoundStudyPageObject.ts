import { Locator, Page } from '@playwright/test';

export class NotFoundStudyPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get errorMessage(): Locator {
    return this.page.getByText(
      'One or more of the requested studies are not available at this time.'
    );
  }

  get studyListLink(): Locator {
    return this.page.getByRole('link', { name: 'study list' });
  }
}
