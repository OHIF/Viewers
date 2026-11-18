import { expect, forceViewportFidelity, test, visitStudy, waitForViewportsRendered } from './utils';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  await visitStudy(page, studyInstanceUID, 'viewer', 2000);
});

test.describe('Fidelity indicator placement', () => {
  test('shows top-left after orientation/data-overlay action icons', async ({
    page,
    mainToolbarPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await waitForViewportsRendered(page);

    await forceViewportFidelity(page, { lossy: true, transient: false });

    const viewportPane = page.locator('[data-cy="viewport-pane"]').first();
    const topLeftOverlay = viewportPane.locator('[data-cy="viewport-overlay-top-left"]');
    const fidelity = topLeftOverlay.getByTestId('fidelity-indicator');

    await expect(fidelity).toBeVisible({ timeout: 30_000 });

    // Reveal hover-gated action corners.
    await viewportPane.hover({ position: { x: 40, y: 40 } });
    const orientationMenu = viewportPane.locator('[data-cy^="orientationMenu"]').first();
    await expect(orientationMenu).toBeVisible({ timeout: 10_000 });

    const fidelityBox = await fidelity.boundingBox();
    const orientationBox = await orientationMenu.boundingBox();
    const viewportBox = await viewportPane.boundingBox();
    expect(fidelityBox).toBeTruthy();
    expect(orientationBox).toBeTruthy();
    expect(viewportBox).toBeTruthy();

    // After the orientation icon (dataOverlay sits between them; allow tiny subpixel slack).
    expect(fidelityBox!.x).toBeGreaterThanOrEqual(orientationBox!.x + orientationBox!.width - 2);
    expect(fidelityBox!.x).toBeLessThan(viewportBox!.x + viewportBox!.width / 2);

    const studyDate = topLeftOverlay.locator('[title="Study date"]').first();
    if (await studyDate.count()) {
      await expect(studyDate).toBeVisible();
      const studyDateBox = await studyDate.boundingBox();
      expect(studyDateBox).toBeTruthy();
      expect(studyDateBox!.y).toBeGreaterThan(fidelityBox!.y + fidelityBox!.height - 2);
      // Historic .overlay-top band (2.15rem from viewport top); fidelity is absolute so it
      // must not add an extra icon row above StudyDate.
      const historicOverlayTop = viewportBox!.y + 2.15 * 16;
      expect(studyDateBox!.y).toBeGreaterThanOrEqual(historicOverlayTop - 4);
      expect(studyDateBox!.y).toBeLessThan(historicOverlayTop + 8);
    }
  });

  test('shows on Volume3D when hideOverlays is set (fidelity only)', async ({
    page,
    mainToolbarPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDOnly.click();
    await waitForViewportsRendered(page);

    await forceViewportFidelity(page, { lossy: true, transient: false });

    const viewportPane = page.locator('[data-cy="viewport-pane"]').first();
    const topLeftOverlay = viewportPane.locator('[data-cy="viewport-overlay-top-left"]');
    const fidelity = topLeftOverlay.getByTestId('fidelity-indicator');

    await expect(fidelity).toBeVisible({ timeout: 30_000 });
    await expect(topLeftOverlay.locator('[title="Study date"]')).toHaveCount(0);
  });
});
