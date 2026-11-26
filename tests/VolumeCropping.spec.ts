import {
  attemptAction,
  expect,
  reduce3DViewportSize,
  test,
  visitStudy,
  waitForViewportsRendered,
} from './utils';

test.beforeEach(async ({ page, mainToolbarPageObject }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  await visitStudy(page, studyInstanceUID, 'viewer', 2000);
  await mainToolbarPageObject.layoutSelection.threeDFourUp.click();
  await attemptAction(() => reduce3DViewportSize(page), 10, 100);
  await waitForViewportsRendered(page);
});

async function getViewportsByType(viewportPageObject) {
  const viewports = await viewportPageObject.getAll();
  const types = await Promise.all(viewports.map(viewport => viewport.getViewportType()));
  return {
    volume3d: viewports[types.indexOf('volume3d')],
    mpr: viewports[types.indexOf('orthographic')],
  };
}

test.describe('Volume cropping', () => {
  test('cycles Active, Passive, and Off, with the crop box in the MPR viewports', async ({
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const { volume3d, mpr } = await getViewportsByType(viewportPageObject);
    // The corner menu shows on the active viewport only.
    await volume3d.normalizedClickAt([{ x: 0.95, y: 0.05 }]);
    const cropMenu = volume3d.overlayMenu.volumeCropping.button;
    const mprCropLines = mpr.svg('line');

    await expect(cropMenu).toBeHidden();

    // Active: the corner menu shows, and the MPR viewports draw the crop box.
    await mainToolbarPageObject.moreTools.volumeCropping.click();
    await expect(cropMenu).toBeVisible();
    await expect(mprCropLines.first()).toBeAttached();

    // Passive: the crop box stays.
    await mainToolbarPageObject.moreTools.volumeCropping.click();
    await expect(cropMenu).toBeVisible();
    await expect(mprCropLines.first()).toBeAttached();

    // Off: the corner menu and the crop box go away.
    await mainToolbarPageObject.moreTools.volumeCropping.click();
    await expect(cropMenu).toBeHidden();
    await expect(mprCropLines).toHaveCount(0);
  });

  test('moves the crop box when the user drags a crop line in an MPR viewport', async ({
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    const { mpr } = await getViewportsByType(viewportPageObject);
    await mainToolbarPageObject.moreTools.volumeCropping.click();

    const firstLine = mpr.svg('line').first();
    await expect(firstLine).toBeAttached();
    const lineX = Number(await firstLine.getAttribute('x1'));
    const { width } = await mpr.svg().boundingBox();
    const x = lineX / width;

    await mpr.normalizedDragAt({ start: { x, y: 0.5 }, end: { x: x + 0.1, y: 0.5 } });
    await expect(firstLine).not.toHaveAttribute('x1', String(lineX));
  });
});
