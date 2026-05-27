import {
  initializeMousePositionTracker,
  expect,
  test,
  visitStudy,
} from './utils/index.js';

/** Slower than default actionTimeout (10s); MPR crosshair SVG can lag on busy CI workers. */
const CROSSHAIRS_DOM_TIMEOUT_MS = 30_000;

async function getLayerSignature(page, layerId: string) {
  const layer = page.locator(`#${layerId}`);
  const lineCount = await layer.locator('line').count();
  const circleCount = await layer.locator('circle').count();
  const rectCount = await layer.locator('rect').count();
  const signatureParts: string[] = [];
  const t = { timeout: CROSSHAIRS_DOM_TIMEOUT_MS };

  for (let i = 0; i < lineCount; i++) {
    const line = layer.locator('line').nth(i);
    await line.waitFor({ state: 'attached', ...t });
    const [x1, y1, x2, y2] = await Promise.all([
      line.getAttribute('x1', t),
      line.getAttribute('y1', t),
      line.getAttribute('x2', t),
      line.getAttribute('y2', t),
    ]);
    signatureParts.push(`line:${x1}|${y1}|${x2}|${y2}`);
  }

  for (let i = 0; i < circleCount; i++) {
    const circle = layer.locator('circle').nth(i);
    await circle.waitFor({ state: 'attached', ...t });
    const [cx, cy, r] = await Promise.all([
      circle.getAttribute('cx', t),
      circle.getAttribute('cy', t),
      circle.getAttribute('r', t),
    ]);
    signatureParts.push(`circle:${cx}|${cy}|${r}`);
  }

  for (let i = 0; i < rectCount; i++) {
    const rect = layer.locator('rect').nth(i);
    await rect.waitFor({ state: 'attached', ...t });
    const [x, y, width, height] = await Promise.all([
      rect.getAttribute('x', t),
      rect.getAttribute('y', t),
      rect.getAttribute('width', t),
      rect.getAttribute('height', t),
    ]);
    signatureParts.push(`rect:${x}|${y}|${width}|${height}`);
  }

  return signatureParts.join(';');
}

async function getCrosshairsSignature(page) {
  // Read layers sequentially so we are not racing three heavy SVG trees on one page (flaky on CI).
  const axial = await getLayerSignature(page, 'svg-layer-mpr-axial');
  const sagittal = await getLayerSignature(page, 'svg-layer-mpr-sagittal');
  const coronal = await getLayerSignature(page, 'svg-layer-mpr-coronal');
  return `${axial}||${sagittal}||${coronal}`;
}

async function areLayerLinesAxisAligned(page, layerId: string) {
  const lines = page.locator(`#${layerId}`).locator('line');
  const lineCount = await lines.count();
  if (lineCount < 4) {
    return false;
  }

  const t = { timeout: CROSSHAIRS_DOM_TIMEOUT_MS };
  for (let i = 0; i < 4; i++) {
    const line = lines.nth(i);
    const [x1, y1, x2, y2] = await Promise.all([
      line.getAttribute('x1', t),
      line.getAttribute('y1', t),
      line.getAttribute('x2', t),
      line.getAttribute('y2', t),
    ]);
    const isVertical = x1 === x2;
    const isHorizontal = y1 === y2;
    if (!isVertical && !isHorizontal) {
      return false;
    }
  }

  return true;
}

async function expectCrosshairsReady(page) {
  for (const layerId of ['svg-layer-mpr-axial', 'svg-layer-mpr-sagittal', 'svg-layer-mpr-coronal']) {
    const locator = page.locator(`#${layerId}`);
    await locator.waitFor({ state: 'visible' });
    await expect(locator.locator('line')).toHaveCount(4);
  }
}

test.beforeEach(async ({ page, leftPanelPageObject }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
  // Force a deterministic base series so thumbnail ordering changes do not
  // alter which stack drives MPR/crosshairs behavior.
  await leftPanelPageObject.loadSeriesByDescription('PRE LIVER');
  await initializeMousePositionTracker(page);
});

test.describe('Crosshairs Test', async () => {
  test('should render the crosshairs correctly.', async ({ page, mainToolbarPageObject }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();
    await expectCrosshairsReady(page);
  });

  test('should allow the user to rotate the crosshairs', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();
    await expectCrosshairsReady(page);
    const beforeRotate = await getCrosshairsSignature(page);

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();
    const afterRotate = await getCrosshairsSignature(page);
    expect(afterRotate).not.toEqual(beforeRotate);
  });

  test('should allow the user to adjust the slab thickness', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();
    await expectCrosshairsReady(page);
    const beforeIncrease = await getLayerSignature(page, 'svg-layer-mpr-axial');

    await viewportPageObject.crosshairs.axial.increase();
    await viewportPageObject.crosshairs.sagittal.increase();
    await viewportPageObject.crosshairs.coronal.increase();
    const afterIncrease = await getLayerSignature(page, 'svg-layer-mpr-axial');
    expect(afterIncrease).not.toEqual(beforeIncrease);
  });

  test('should reset the crosshairs to the initial position when reset is clicked', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();
    await expectCrosshairsReady(page);
    const initialPosition = await getCrosshairsSignature(page);

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();
    const rotatedPosition = await getCrosshairsSignature(page);
    expect(rotatedPosition).not.toEqual(initialPosition);

    await mainToolbarPageObject.moreTools.reset.click();
    await expectCrosshairsReady(page);
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-axial')).toBeTruthy();
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-sagittal')).toBeTruthy();
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-coronal')).toBeTruthy();
  });

  test('should reset the crosshairs when a new displayset is loaded', async ({
    page,
    mainToolbarPageObject,
    leftPanelPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await mainToolbarPageObject.crosshairs.click();
    await expectCrosshairsReady(page);
    const initialPosition = await getCrosshairsSignature(page);

    await viewportPageObject.crosshairs.axial.rotate();
    await viewportPageObject.crosshairs.sagittal.rotate();
    await viewportPageObject.crosshairs.coronal.rotate();
    const rotatedPosition = await getCrosshairsSignature(page);
    expect(rotatedPosition).not.toEqual(initialPosition);

    await leftPanelPageObject.loadSeriesByDescription('Recon 3: LIVER 3 PHASE (AP)');
    await expectCrosshairsReady(page);
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-axial')).toBeTruthy();
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-sagittal')).toBeTruthy();
    expect(await areLayerLinesAxisAligned(page, 'svg-layer-mpr-coronal')).toBeTruthy();
  });
});
