import { test as base } from 'playwright-test-coverage';
import { MainToolbarPage, ViewportGridPage } from '../pages';

type PageObjects = {
  mainToolbarPage: MainToolbarPage;
  viewportGridPage: ViewportGridPage;
};

export const test = base.extend<PageObjects>({
  mainToolbarPage: async ({ page }, use) => {
    await use(new MainToolbarPage(page));
  },
  viewportGridPage: async ({ page }, use) => {
    await use(new ViewportGridPage(page));
  },
});

export { expect } from 'playwright-test-coverage';
