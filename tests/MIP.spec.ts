import {
  checkForScreenshot,
  getViewportCanvasStats,
  screenShotPaths,
  test,
  expect,
  visitStudy,
  waitForViewportsRendered,
} from './utils';

const STUDY_INSTANCE_UID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';

type ProjectionReadback = {
  projection: { blendOp: string; slabThickness: number } | undefined;
  support: { supported: boolean; reason?: string };
};

/**
 * Reads the projection state the engine reports for a viewport through the
 * ProjectionService (an engine read-back, not remembered UI state).
 */
async function readProjection(page, viewportId: string): Promise<ProjectionReadback> {
  return page.evaluate(
    ({ services, viewportId }: withTestTypes<{ viewportId: string }>) => {
      const { projectionService } = services as unknown as {
        projectionService: {
          getProjection: (t: { viewportId: string }) => ProjectionReadback['projection'];
          supportsProjection: (t: { viewportId: string }) => ProjectionReadback['support'];
        };
      };
      return {
        projection: projectionService.getProjection({ viewportId }),
        support: projectionService.supportsProjection({ viewportId }),
      };
    },
    { viewportId, services: await page.evaluateHandle('window.services') }
  );
}

/** Runs an OHIF command inside the page through the window-exposed commands manager. */
async function runCommand(page, commandName: string, options: Record<string, unknown>) {
  return page.evaluate(
    ({
      commandsManager,
      commandName,
      options,
    }: {
      commandsManager: { run: (name: string, opts: Record<string, unknown>) => unknown };
      commandName: string;
      options: Record<string, unknown>;
    }) => commandsManager.run(commandName, options),
    {
      commandName,
      options,
      commandsManager: await page.evaluateHandle('window.commandsManager'),
    }
  );
}

test.beforeEach(async ({ page }) => {
  await visitStudy(page, STUDY_INSTANCE_UID, 'viewer', 2000);
});

test.describe('MIP (maximum intensity projection)', () => {
  test('should enable MIP on an MPR viewport, change the slab, and restore the slice on toggle off', async ({
    page,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    await mainToolbarPageObject.layoutSelection.MPR.click();
    await waitForViewportsRendered(page);

    const viewportId = 'mpr-axial';
    const axial = await viewportPageObject.getById(viewportId);

    // Wait until the engine reports a fully loaded, projectable volume.
    await expect
      .poll(async () => (await readProjection(page, viewportId)).support, { timeout: 60_000 })
      .toEqual({ supported: true });

    const before = await getViewportCanvasStats({ page, viewportId });

    // Open the projection menu from the viewport corner and switch MIP on.
    await axial.pane.hover();
    await axial.overlayMenu.projection.click();
    const toggle = page.getByTestId('projection-toggle');
    await expect(toggle).toBeEnabled();
    await toggle.click();

    await expect
      .poll(async () => (await readProjection(page, viewportId)).projection, { timeout: 15_000 })
      .toEqual({ blendOp: 'max', slabThickness: 10 });
    await waitForViewportsRendered(page);

    const projected = await getViewportCanvasStats({ page, viewportId });
    // A 10 mm MIP through the head CT must produce a different frame than the single slice.
    expect(projected.digest).not.toBe(before.digest);
    expect(projected.nonBlackRatio).toBeGreaterThan(0);

    await checkForScreenshot({
      page,
      locator: viewportPageObject.grid,
      screenshotPath: screenShotPaths.mip.mipEnabledDisplayedCorrectly,
    });

    // Thicker slab through the slab command (the slider is debounced UI over the same path).
    await runCommand(page, 'setSlabThickness', { viewportId, slabThickness: 60 });
    await expect
      .poll(async () => (await readProjection(page, viewportId)).projection, { timeout: 15_000 })
      .toEqual({ blendOp: 'max', slabThickness: 60 });
    await waitForViewportsRendered(page);
    const thick = await getViewportCanvasStats({ page, viewportId });
    expect(thick.digest).not.toBe(projected.digest);

    // Off restores the non-projected rendering exactly.
    await page.getByTestId('projection-toggle').click();
    await expect
      .poll(async () => (await readProjection(page, viewportId)).projection, { timeout: 15_000 })
      .toEqual({ blendOp: 'none', slabThickness: 0 });
    await waitForViewportsRendered(page);
    const restored = await getViewportCanvasStats({ page, viewportId });
    expect(restored.digest).toBe(before.digest);
  });

  test('should promote a stack viewport to a volume viewport on first enable', async ({
    page,
    viewportPageObject,
  }) => {
    const viewportId = 'default';
    const single = await viewportPageObject.getById(viewportId);

    await single.pane.hover();
    await single.overlayMenu.projection.click();
    await page.getByTestId('projection-toggle').click();

    await expect
      .poll(async () => (await readProjection(page, viewportId)).projection, { timeout: 60_000 })
      .toEqual({ blendOp: 'max', slabThickness: 10 });

    const shape = await page.evaluate(
      ({ services, viewportId }: withTestTypes<{ viewportId: string }>) => {
        const viewport = services.cornerstoneViewportService.getCornerstoneViewport(
          viewportId
        ) as unknown as { getCurrentMode?: () => string; type: string };
        return viewport.getCurrentMode?.() ?? viewport.type;
      },
      { viewportId, services: await page.evaluateHandle('window.services') }
    );
    expect(['volume', 'orthographic']).toContain(shape);
  });
});
