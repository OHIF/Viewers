import { Page } from '@playwright/test';

/** Default max time for {@link waitForViewportGridCornerstoneRendered} (viewport grid present + Cornerstone RENDERED + volumes loaded). */
export const DEFAULT_VIEWPORT_GRID_RENDER_TIMEOUT_MS = 120_000;

const VIEWPORT_RENDER_TIMEOUT = DEFAULT_VIEWPORT_GRID_RENDER_TIMEOUT_MS;

export type VisitStudyOptions = {
  /**
   * App route mode (e.g. `microscopy`, `tmtv`, `segmentation`). Defaults to `viewer`.
   */
  mode?: string;
  /** URL segment after mode (default `ohif`) */
  datasources?: string;
  /**
   * Extra wait (ms) after network idle when {@link skipCornerstoneRenderedWait} is true,
   * or after all Cornerstone viewports are `RENDERED` when it is false.
   */
  settleMs?: number;
  /**
   * Modes like microscopy do not use Cornerstone viewports that reach `RENDERED`.
   * When true, skips the render gate and only applies {@link settleMs} after network idle.
   */
  skipCornerstoneRenderedWait?: boolean;
};

/**
 * Open a study in the given mode.
 *
 * @param page - Playwright page
 * @param studyInstanceUID - Study to load
 * @param options - Optional mode (default `viewer`), datasource, settle time, render gating
 */
export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  options: VisitStudyOptions = {}
) {
  const {
    mode = 'viewer',
    datasources = 'ohif',
    settleMs = 0,
    skipCornerstoneRenderedWait = false,
  } = options;

  await page.goto(`/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  if (skipCornerstoneRenderedWait) {
    if (settleMs > 0) {
      await page.waitForTimeout(settleMs);
    }
    return;
  }

  await page.waitForFunction(
    () => {
      const win = globalThis as unknown as {
        cornerstone?: {
          getEnabledElements: () => { viewport?: { viewportStatus?: unknown } }[];
          Enums?: { ViewportStatus?: { RENDERED?: number } };
        };
      };
      const cornerstone = win.cornerstone;
      if (!cornerstone) return false;

      const viewports = cornerstone.getEnabledElements?.() ?? [];
      if (viewports.length === 0) return false;

      const RENDERED = cornerstone.Enums?.ViewportStatus?.RENDERED;
      const allRendered = viewports.every(ee => {
        const status = (ee.viewport as { viewportStatus?: unknown })?.viewportStatus;
        return RENDERED != null && status === RENDERED;
      });

      return allRendered;
    },
    { timeout: VIEWPORT_RENDER_TIMEOUT }
  );

  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

export type WaitForViewportGridCornerstoneRenderedOptions = {
  /** @default {@link DEFAULT_VIEWPORT_GRID_RENDER_TIMEOUT_MS} */
  timeout?: number;
};

/**
 * Poll until `[data-cy="viewport-grid"]` exists and every viewport in that grid reports
 * Cornerstone `ViewportStatus.RENDERED`, and referenced volumes in cache are loaded.
 * Same condition as the post-navigation gate in {@link visitStudyRendered}; use after layout
 * or hydration actions so screenshots target a stable grid.
 */
export async function waitForViewportGridCornerstoneRendered(
  page: Page,
  options: WaitForViewportGridCornerstoneRenderedOptions = {}
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_VIEWPORT_GRID_RENDER_TIMEOUT_MS;

  await page.waitForFunction(
    () => {
      const globalWindow = window as Window & { cornerstone?: any };
      const cornerstone = globalWindow.cornerstone;
      if (!cornerstone?.getEnabledElements) {
        return false;
      }

      const viewportGrid = document.querySelector('[data-cy="viewport-grid"]');
      if (!(viewportGrid instanceof HTMLElement)) {
        return false;
      }

      const gridViewportIds = new Set(
        Array.from(viewportGrid.querySelectorAll('[data-viewportid]'))
          .map(el => el.getAttribute('data-viewportid'))
          .filter(Boolean)
      );

      const allEnabledElements = cornerstone.getEnabledElements();
      const enabledElements = allEnabledElements.filter((enabledElement: unknown) => {
        const ee = enabledElement as {
          element?: unknown;
          viewportId?: string;
          viewport?: { id?: string };
        };
        const element = ee?.element;
        const viewportId = ee?.viewportId ?? ee?.viewport?.id;
        const isElementInGrid = element instanceof HTMLElement && viewportGrid.contains(element);
        const isViewportIdInGrid =
          typeof viewportId === 'string' && gridViewportIds.has(viewportId);

        return isElementInGrid || isViewportIdInGrid;
      });
      const viewports = enabledElements
        .map(
          (enabledElement: unknown) =>
            (enabledElement as { viewport?: { viewportStatus?: string } })?.viewport
        )
        .filter(Boolean);

      if (viewports.length < 1) {
        return false;
      }

      const allRendered = viewports.every(viewport => viewport.viewportStatus === 'rendered');
      if (!allRendered) {
        return false;
      }

      for (const viewport of viewports) {
        if (typeof viewport.getActors !== 'function') {
          continue;
        }

        const actors = viewport.getActors() || [];
        for (const actor of actors) {
          const volumeId = actor?.referencedId;
          if (!volumeId) {
            continue;
          }

          const volume = cornerstone?.cache?.getVolume?.(volumeId);
          if (volume?.loadStatus && !volume.loadStatus.loaded) {
            return false;
          }
        }
      }
      return true;
    },
    undefined,
    { timeout }
  );
}

/**
 * Visit the study and wait for cornerstone viewports to be rendered.
 * For volume viewports, also waits until associated volumes are fully loaded.
 * @param page - The page to interact with
 * @param studyInstanceUID - The study instance UID of the study to visit
 * @param options - options for mode, delay, and datasources
 * @param delay - The delay to wait after visiting the study
 * @param datasources - the data source to load the study from
 */
export async function visitStudyRendered(
  page: Page,
  studyInstanceUID: string,
  options: {
    mode?: string;
    delay?: number;
    datasources?: string;
    loadTimeout?: number;
  } = {}
) {
  const {
    mode = 'viewer',
    delay,
    datasources = 'ohif',
    loadTimeout = DEFAULT_VIEWPORT_GRID_RENDER_TIMEOUT_MS,
  } = options;

  const url = `/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`;
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  await waitForViewportGridCornerstoneRendered(page, { timeout: loadTimeout });

  if (delay != null) {
    await page.waitForTimeout(delay);
  }
}
