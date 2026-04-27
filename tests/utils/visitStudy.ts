import { Page } from '@playwright/test';

/**
 * Visit the study
 * @param page - The page to interact with
 * @param title - The study instance UID of the study to visit
 * @param mode - The mode to visit the study in
 * @param delay - The delay to wait after visiting the study
 * @param datasources - the data source to load the study from
 */
export async function visitStudy(
  page: Page,
  studyInstanceUID: string,
  mode: string,
  delay: number = 0,
  datasources = 'ohif'
) {
  // await page.goto(`/?resultsPerPage=100&datasources=${datasources}`);
  // await page.getByTestId(studyInstanceUID).click();
  // await page.getByRole('button', { name: mode }).click();
  await page.goto(`/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(delay);
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
  const { mode = 'viewer', delay, datasources = 'ohif', loadTimeout = 60000 } = options;

  const url = `/${mode}/${datasources}?StudyInstanceUIDs=${studyInstanceUID}`;
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

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
      const enabledElements = allEnabledElements.filter(enabledElement => {
        const element = enabledElement?.element;
        const viewportId = enabledElement?.viewportId ?? enabledElement?.viewport?.id;
        const isElementInGrid = element instanceof HTMLElement && viewportGrid.contains(element);
        const isViewportIdInGrid =
          typeof viewportId === 'string' && gridViewportIds.has(viewportId);

        return isElementInGrid || isViewportIdInGrid;
      });
      const viewports = enabledElements
        .map(enabledElement => enabledElement?.viewport)
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
    { timeout: loadTimeout }
  );

  if (delay != null) {
    await page.waitForTimeout(delay);
  }
}
