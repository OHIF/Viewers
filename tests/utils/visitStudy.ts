import { Page } from 'playwright-test-coverage';

const VIEWPORT_RENDER_TIMEOUT = 60_000;

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
