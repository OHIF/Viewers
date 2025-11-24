import { test as base } from 'playwright-test-coverage';
import { MainToolbarPageObject, ViewportPageObject } from '../pages';

type PageObjects = {
  mainToolbarPageObject: MainToolbarPageObject;
  viewportPageObject: ViewportPageObject;
};

export const test = base.extend<PageObjects>({
  mainToolbarPageObject: async ({ page }, use) => {
    await use(new MainToolbarPageObject(page));
  },
  viewportPageObject: async ({ page }, use) => {
    await use(new ViewportPageObject(page));
  },
});

export { expect } from 'playwright-test-coverage';
