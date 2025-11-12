import { test as base } from 'playwright-test-coverage';
import { MainToolbarPageObject, ViewportGridPageObject } from '../pages';

type PageObjects = {
  mainToolbarPageObject: MainToolbarPageObject;
  viewportGridPageObject: ViewportGridPageObject;
};

export const test = base.extend<PageObjects>({
  mainToolbarPageObject: async ({ page }, use) => {
    await use(new MainToolbarPageObject(page));
  },
  viewportGridPageObject: async ({ page }, use) => {
    await use(new ViewportGridPageObject(page));
  },
});

export { expect } from 'playwright-test-coverage';
