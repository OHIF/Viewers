import { test as base } from 'playwright-test-coverage';
import {
  MainToolbarPageObject,
  LeftPanelPageObject,
  OverlayPageObject,
  RightPanelPageObject,
  ViewportPageObject,
} from '../pages';

type PageObjects = {
  mainToolbarPageObject: MainToolbarPageObject;
  leftPanelPageObject: LeftPanelPageObject;
  overlayPageObject: OverlayPageObject;
  rightPanelPageObject: RightPanelPageObject;
  viewportPageObject: ViewportPageObject;
};

export const test = base.extend<PageObjects>({
  mainToolbarPageObject: async ({ page }, use) => {
    await use(new MainToolbarPageObject(page));
  },
  leftPanelPageObject: async ({ page }, use) => {
    await use(new LeftPanelPageObject(page));
  },
  overlayPageObject: async ({ page }, use) => {
    await use(new OverlayPageObject(page));
  },
  rightPanelPageObject: async ({ page }, use) => {
    await use(new RightPanelPageObject(page));
  },
  viewportPageObject: async ({ page }, use) => {
    await use(new ViewportPageObject(page));
  },
});

export { expect } from 'playwright-test-coverage';
