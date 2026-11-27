import type { Page } from '@playwright/test';
import { expect, forceViewportFidelity, test, visitStudy, waitForViewportsRendered } from './utils';

/** Appends buttons to a viewport action corner, the way a mode or a site customization does. */
async function addViewportActionButtons(
  page: Page,
  corner: 'topLeft' | 'topRight',
  buttonIds: string[]
) {
  await page.evaluate(
    ({ corner: cornerName, buttonIds: ids }) => {
      const { toolbarService } = (window as any).services;
      toolbarService.updateSection(toolbarService.sections.viewportActionMenu[cornerName], ids);
    },
    { corner, buttonIds }
  );
}

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  await visitStudy(page, studyInstanceUID, 'viewer', 2000);
});

test.describe('Fidelity indicator placement', () => {
  test('shows in the top-right corner, level with the action corners', async ({
    page,
    mainToolbarPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await waitForViewportsRendered(page);

    await forceViewportFidelity(page, { lossy: true, transient: false });

    const viewportPane = page.locator('[data-cy="viewport-pane"]').first();
    const fidelity = viewportPane.getByTestId('fidelity-indicator');

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

    // In the right half of the viewport, on the same row as the top-left action icons.
    expect(fidelityBox!.x).toBeGreaterThan(viewportBox!.x + viewportBox!.width / 2);
    expect(Math.abs(fidelityBox!.y - orientationBox!.y)).toBeLessThanOrEqual(2);

    // The indicator is not overlay text: StudyDate stays at the historic .overlay-top
    // band (2.15rem from the viewport top) in the top-left overlay.
    const topLeftOverlay = viewportPane.locator('[data-cy="viewport-overlay-top-left"]');
    await expect(topLeftOverlay.getByTestId('fidelity-indicator')).toHaveCount(0);
    const studyDate = topLeftOverlay.locator('[title="Study date"]').first();
    if (await studyDate.count()) {
      await expect(studyDate).toBeVisible();
      const studyDateBox = await studyDate.boundingBox();
      expect(studyDateBox).toBeTruthy();
      const historicOverlayTop = viewportBox!.y + 2.15 * 16;
      expect(studyDateBox!.y).toBeGreaterThanOrEqual(historicOverlayTop - 4);
      expect(studyDateBox!.y).toBeLessThan(historicOverlayTop + 8);
    }
  });

  test('top-right action items are to the left of the indicator', async ({
    page,
    mainToolbarPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await waitForViewportsRendered(page);

    await addViewportActionButtons(page, 'topRight', ['windowLevelMenu']);
    await forceViewportFidelity(page, { lossy: true, transient: false });

    const viewportPane = page.locator('[data-cy="viewport-pane"]').first();
    const fidelity = viewportPane.getByTestId('fidelity-indicator');
    await expect(fidelity).toBeVisible({ timeout: 30_000 });

    await viewportPane.hover({ position: { x: 40, y: 120 } });
    const topRightItem = viewportPane
      .locator('[data-cy^="windowLevelMenu"]')
      .first();
    await expect(topRightItem).toBeVisible({ timeout: 10_000 });

    await expect(async () => {
      const itemBox = await topRightItem.boundingBox();
      const fidelityBox = await fidelity.boundingBox();
      expect(itemBox).toBeTruthy();
      expect(fidelityBox).toBeTruthy();
      expect(itemBox!.x + itemBox!.width).toBeLessThanOrEqual(fidelityBox!.x + 1);
      // Level with the item beside it, not centred in the taller toolbar row (VF-VIS-9).
      expect(Math.abs(itemBox!.y - fidelityBox!.y)).toBeLessThanOrEqual(2);
    }).toPass({ timeout: 5_000 });
  });

  test('shows on Volume3D when hideOverlays is set', async ({
    page,
    mainToolbarPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.threeDOnly.click();
    await waitForViewportsRendered(page);

    await forceViewportFidelity(page, { lossy: true, transient: false });

    const viewportPane = page.locator('[data-cy="viewport-pane"]').first();
    const fidelity = viewportPane.getByTestId('fidelity-indicator');

    await expect(fidelity).toBeVisible({ timeout: 30_000 });
    await expect(
      viewportPane.locator('[data-cy="viewport-overlay-top-left"] [title="Study date"]')
    ).toHaveCount(0);
  });
});
