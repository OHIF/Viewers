import { test as base } from 'playwright-test-coverage';
import {
  FloatingElementsPageObject,
  MainToolbarPageObject,
  LeftPanelPageObject,
  RightPanelPageObject,
  ViewportPageObject,
} from '../pages';

type PageObjects = {
  floatingElementsPageObject: FloatingElementsPageObject;
  mainToolbarPageObject: MainToolbarPageObject;
  leftPanelPageObject: LeftPanelPageObject;
  rightPanelPageObject: RightPanelPageObject;
  viewportPageObject: ViewportPageObject;
};

export const test = base.extend<PageObjects>({
  floatingElementsPageObject: async ({ page }, use) => {
    await use(new FloatingElementsPageObject(page));
  },
  mainToolbarPageObject: async ({ page }, use) => {
    await use(new MainToolbarPageObject(page));
  },
  leftPanelPageObject: async ({ page }, use) => {
    await use(new LeftPanelPageObject(page));
  },
  rightPanelPageObject: async ({ page }, use) => {
    await use(new RightPanelPageObject(page));
  },
  viewportPageObject: async ({ page }, use) => {
    await use(new ViewportPageObject(page));
  },
});

export { expect } from 'playwright-test-coverage';
