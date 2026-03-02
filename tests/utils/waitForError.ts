import { Page } from '@playwright/test';

export function waitForError(page: Page, timeout = 3000) {
  return page
    .locator('[data-sonner-toast][data-type="error"]')
    .waitFor({ state: 'attached', timeout });
}
