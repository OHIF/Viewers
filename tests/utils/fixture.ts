import { test as base } from 'playwright-test-coverage';
import { addOHIFConfiguration } from './OHIFConfiguration';
import {
  DOMOverlayPageObject,
  MainToolbarPageObject,
  LeftPanelPageObject,
  RightPanelPageObject,
  ViewportPageObject,
  NotFoundStudyPageObject,
} from '../pages';

type PageObjects = {
  DOMOverlayPageObject: DOMOverlayPageObject;
  mainToolbarPageObject: MainToolbarPageObject;
  leftPanelPageObject: LeftPanelPageObject;
  rightPanelPageObject: RightPanelPageObject;
  viewportPageObject: ViewportPageObject;
  notFoundStudyPageObject: NotFoundStudyPageObject;
};

export type TestOptions = {
  /** Runs the viewer on the new viewports (`genericViewports.enabled`). Set per project. */
  useNextViewports: boolean;
};

type TestFixtures = PageObjects &
  TestOptions & {
    _applyGlobalE2EOHIFBaseline: void;
  };

export const test = base.extend<TestFixtures>({
  useNextViewports: [false, { option: true }],
  _applyGlobalE2EOHIFBaseline: [
    async ({ page, useNextViewports }, use) => {
      const config = useNextViewports ? { genericViewports: { enabled: true } } : {};
      await addOHIFConfiguration(page, config);
      await use();
    },
    { auto: true },
  ],
  DOMOverlayPageObject: async ({ page }, use) => {
    await use(new DOMOverlayPageObject(page));
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
  notFoundStudyPageObject: async ({ page }, use) => {
    await use(new NotFoundStudyPageObject(page));
  },
});

export { expect } from 'playwright-test-coverage';
