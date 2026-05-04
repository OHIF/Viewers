import type { Page } from '@playwright/test';

type WaitForAnyViewportNeedsRenderOptions = {
  timeout?: number;
};

type WaitForViewportsRenderedOptions = {
  timeout?: number;
  /**
   * If true (default), also waits for any volume actors referenced by the
   * viewports to report loaded.
   */
  waitVolumeLoad?: boolean;
};

type WaitForRenderCycleToCompleteOptions = {
  /**
   * Timeout for waiting until at least one viewport reaches `needsRender`.
   */
  needsRenderTimeout?: number;
  /**
   * Timeout for waiting until all viewports are `rendered`
   * (and optionally volume-loaded).
   */
  renderedTimeout?: number;
  /**
   * If true (default), also waits for any volume actors referenced by the
   * viewports to report loaded during the rendered phase.
   */
  waitVolumeLoad?: boolean;
};

/**
 * Waits for a full render cycle:
 * 1) any viewport requests render (`needsRender`)
 * 2) all viewports finish rendering (`rendered`)
 */
const waitForViewportRenderCycle = async (
  page: Page,
  options: WaitForRenderCycleToCompleteOptions = {}
) => {
  const { needsRenderTimeout = 5000, renderedTimeout = 15000, waitVolumeLoad = true } = options;
  await waitForAnyViewportNeedsRender(page, { timeout: needsRenderTimeout });
  await waitForViewportsRendered(page, { timeout: renderedTimeout, waitVolumeLoad });
};

/**
 * Waits until at least one viewport enters the 'needsRender' state, indicating
 * that a render has been requested but not yet started.
 */
const waitForAnyViewportNeedsRender = async (
  page: Page,
  options: WaitForAnyViewportNeedsRenderOptions = {}
) => {
  const { timeout = 5000 } = options;
  await page.waitForFunction(
    () => {
      const cornerstone = (window as any).cornerstone;
      if (!cornerstone?.getRenderingEngines) {
        return false;
      }

      const renderingEngines = cornerstone.getRenderingEngines();
      const viewports = renderingEngines.flatMap(engine =>
        engine.getViewports ? engine.getViewports() : []
      );

      if (!viewports.length) {
        return false;
      }

      const needsRender = viewports.some(viewport => viewport?.viewportStatus === 'needsRender');

      return needsRender;
    },
    {},
    { timeout }
  );
};

/**
 * Stabilize tests by waiting for a short tick, network idle, then viewport render completion.
 * To use this method safely, you may need to make changes to OHIF and/or CS3D
 * methods handling clicks (SHOULD be commands modules only).  These should set the
 * state to needs render synchronously so that this method can safely wait for the render to complete.
 * Examples such as changing the hanging protocol currently don't set such a state
 * and thus can't be rendered without a delay.
 *
 * If options.waitVolumeLoad is not false, then this method will wait for all volumes
 * associated with viewports to be loaded.
 */
const waitForViewportsRendered = async (
  page: Page,
  options: WaitForViewportsRenderedOptions = {}
) => {
  const { timeout = 15000, waitVolumeLoad = true } = options;

  await page.waitForFunction(
    ({ waitVolumeLoad }) => {
      const cornerstone = (window as any).cornerstone;
      if (!cornerstone?.getRenderingEngines) {
        return false;
      }

      const renderingEngines = cornerstone.getRenderingEngines();
      const viewports = renderingEngines.flatMap(engine =>
        engine.getViewports ? engine.getViewports() : []
      );

      if (!viewports.length) {
        return false;
      }

      const allRendered = viewports.every(viewport => viewport?.viewportStatus === 'rendered');

      if (!allRendered) {
        return false;
      }

      if (!waitVolumeLoad) {
        return true;
      }

      const cache = cornerstone.cache;
      if (!cache?.getVolume) {
        return true;
      }

      const actorEntries = viewports.flatMap(viewport =>
        viewport?.getActors ? viewport.getActors() : []
      );

      for (const actorEntry of actorEntries) {
        const id = actorEntry?.referencedId || actorEntry?.uid;
        if (!id) {
          continue;
        }

        let volume: any;
        try {
          volume = cache.getVolume(id);
        } catch {
          continue;
        }

        const loaded =
          volume?.loadStatus && typeof volume.loadStatus.loaded === 'boolean'
            ? volume.loadStatus.loaded
            : true;

        if (!loaded) {
          return false;
        }
      }

      return true;
    },
    { waitVolumeLoad },
    { timeout }
  );
};

export { waitForViewportsRendered, waitForAnyViewportNeedsRender, waitForViewportRenderCycle };
