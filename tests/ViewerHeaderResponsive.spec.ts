import { addOHIFConfiguration, expect, test, visitStudy } from './utils';

const studyInstanceUID = '1.3.6.1.4.1.25403.345050719074.3824.20170125095438.5';

test('keeps the default app header compact on mobile', async ({ page, headerPageObject }) => {
  await addOHIFConfiguration(page, {
    customizationService: [{ 'workList.variant': { $set: 'legacy' } }],
  });
  await page.setViewportSize({ width: 382, height: 693 });
  await page.goto('/');

  await expect(headerPageObject.locator).toBeVisible();

  const headerBox = await headerPageObject.locator.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(headerBox!.height).toBe(48);
});

test('keeps the viewer header regions separate on mobile', async ({ page, headerPageObject }) => {
  await page.setViewportSize({ width: 382, height: 693 });
  await visitStudy(page, studyInstanceUID, 'viewer', 2000);

  const { locator, branding, toolbar, firstToolbarSection, actions, contextActions } =
    headerPageObject;

  await expect(locator).toBeVisible();
  await expect(branding).toBeVisible();
  await expect(toolbar).toBeVisible();
  await expect(actions).toBeVisible();
  await expect(contextActions).toBeVisible();

  const [brandingBox, toolbarBox, actionsBox] = await Promise.all([
    branding.boundingBox(),
    toolbar.boundingBox(),
    actions.boundingBox(),
  ]);

  expect(brandingBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(brandingBox!.y + brandingBox!.height).toBeLessThanOrEqual(toolbarBox!.y);
  expect(brandingBox!.x + brandingBox!.width).toBeLessThanOrEqual(actionsBox!.x);

  // Patient identity must be readable without any scrolling: it is the check the
  // user makes before reading the study.
  await expect(contextActions).toBeInViewport();
  const contextActionsBox = await contextActions.boundingBox();

  expect(contextActionsBox).not.toBeNull();
  expect(contextActionsBox!.y + contextActionsBox!.height).toBeLessThanOrEqual(toolbarBox!.y);

  // The toolbar row itself scrolls horizontally rather than overflowing the header.
  const toolbarOverflow = await toolbar.evaluate(element => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));

  expect(toolbarOverflow.scrollWidth).toBeGreaterThanOrEqual(toolbarOverflow.clientWidth);

  await page.setViewportSize({ width: 640, height: 900 });
  await toolbar.evaluate(element => element.scrollTo({ left: 0 }));
  const [tabletToolbarBox, firstToolbarSectionBox] = await Promise.all([
    toolbar.boundingBox(),
    firstToolbarSection.boundingBox(),
  ]);

  expect(tabletToolbarBox).not.toBeNull();
  expect(firstToolbarSectionBox).not.toBeNull();
  expect(firstToolbarSectionBox!.x).toBeGreaterThanOrEqual(tabletToolbarBox!.x);

  await page.setViewportSize({ width: 1024, height: 900 });
  const desktopHeaderBox = await locator.boundingBox();

  expect(desktopHeaderBox).not.toBeNull();
  expect(desktopHeaderBox!.height).toBe(48);
});
