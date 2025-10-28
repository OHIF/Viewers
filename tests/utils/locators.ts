import { Locator, Page } from '@playwright/test';

export const viewportLocator = ({
  page,
  viewportId,
}: {
  page: Page;
  viewportId: string;
}): Locator => {
  return page.locator(`css=div[data-viewportid="${viewportId}"]`);
};

export const viewportSVGLocator = ({
  page,
  viewportId,
}: {
  page: Page;
  viewportId: string;
}): Locator => {
  return page.locator(`css=div[data-viewportid="${viewportId}"] svg`);
};

export const viewportSVGPathLocator = ({
  page,
  viewportId,
}: {
  page: Page;
  viewportId: string;
}): Locator => {
  return page.locator(`css=div[data-viewportid="${viewportId}"] svg path`);
};
