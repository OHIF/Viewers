import { Locator, Page } from '@playwright/test';
import {
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClicksOnElement,
  simulateNormalizedDragOnElement,
  simulateNormalizedPathDragOnElement,
} from '../utils';
import { DataOverlayPageObject } from './DataOverlayPageObject';
import { DOMOverlayPageObject } from './DOMOverlayPageObject';
import { MagnifyGlassPageObject } from './MagnifyGlassPageObject';

export type SvgInnerElement = 'circle' | 'path' | 'line' | 'g';

type NormalizedDragParams = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  config?: { button?: 'left' | 'right' | 'middle'; delay?: number; steps?: number };
};

type NormalizedPathDragParams = {
  path: { x: number; y: number }[];
  config?: { button?: 'left' | 'right' | 'middle'; delay?: number; steps?: number };
};

export interface IOverlayText {
  locator: Locator;
  get windowLevel(): Locator;
  get instanceNumber(): Locator;
}
function overlayTextFactory(viewport: Locator, id: string): IOverlayText {
  const locator = viewport.getByTestId(id);
  return {
    locator,
    get windowLevel() {
      return locator.getByTitle('Window Level');
    },
    get instanceNumber() {
      return locator.getByTitle('Instance Number');
    },
  };
}

export interface IViewportPageObject {
  nthAnnotation(nth: number): {
    locator: Locator;
    click: () => Promise<void>;
    contextMenu: {
      open: () => Promise<void>;
    };
    text: {
      locator: Locator;
      click: () => Promise<void>;
    };
  };
  clickAt: (
    points: { x: number; y: number }[],
    button?: 'left' | 'right' | 'middle'
  ) => Promise<void>;
  doubleClickAt: (point: { x: number; y: number }) => Promise<void>;
  normalizedClickAt: (
    normalizedPoints: { x: number; y: number }[],
    button?: 'left' | 'right' | 'middle'
  ) => Promise<void>;
  normalizedDragAt: (params: NormalizedDragParams) => Promise<void>;
  normalizedPathDragAt: (params: NormalizedPathDragParams) => Promise<void>;
  orientationMarkers: {
    topMid: Locator;
    leftMid: Locator;
    rightMid: Locator;
    bottomMid: Locator;
  };
  overlayText: {
    topLeft: IOverlayText;
    topRight: IOverlayText;
    bottomLeft: IOverlayText;
    bottomRight: IOverlayText;
  };
  overlayMenu: {
    dataOverlay: DataOverlayPageObject;
    orientation: {
      button: Locator;
      click: () => Promise<void>;
    };
    windowLevel: {
      button: Locator;
      click: () => Promise<void>;
    };
  };
  pane: Locator;
  svg: (innerElement?: SvgInnerElement) => Locator;
  getSvgAnnotationStatTextLines: (uid: string) => Locator;
  navigationArrows: {
    locator: Locator;
    prev: {
      button: Locator;
      click: () => Promise<void>;
    };
    next: {
      button: Locator;
      click: () => Promise<void>;
    };
  };
  sliceNavigation: {
    toSlice: (sliceIndex: number) => Promise<void>;
    toFirstSlice: () => Promise<void>;
    toLastSlice: () => Promise<void>;
    scrollBy: (delta: number) => Promise<void>;
  };
  magnifyGlass: MagnifyGlassPageObject;
  hideDemographicOverlayText: () => Promise<void>;
  hideViewportOverlayText: () => Promise<void>;
  hideAnnotationText: () => Promise<void>;
  hideLateralityText: () => Promise<void>;
  hideOrientationMarkerText: () => Promise<void>;
  hideAllText: () => Promise<void>;
}

export class ViewportPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private getAnnotation(viewport: Locator, nth: number) {
    const page = this.page;
    const domOverlayPageObject = new DOMOverlayPageObject(page);
    const annotation = viewport.locator('g[data-annotation-uid]').nth(nth);
    const textLocator = annotation.locator('text').first();

    return {
      locator: annotation,
      click: async () => {
        await annotation.click();
      },
      contextMenu: {
        open: async () => {
          await domOverlayPageObject.viewport.annotationContextMenu.open(annotation);
        },
      },
      text: {
        locator: textLocator,
        click: async () => {
          await textLocator.click({ force: true });
        },
      },
    };
  }

  private async getViewportId(viewport: Locator): Promise<string> {
    const id = await viewport.locator('[data-viewportid]').getAttribute('data-viewportid');
    if (id === null) {
      throw new Error('Could not resolve data-viewportid from viewport locator');
    }
    return id;
  }

  private getOrientationMarkers(viewport: Locator) {
    return {
      topMid: viewport.locator('.top-mid.orientation-marker'),
      leftMid: viewport.locator('.left-mid.orientation-marker'),
      rightMid: viewport.locator('.right-mid.orientation-marker'),
      bottomMid: viewport.locator('.bottom-mid.orientation-marker'),
    };
  }

  private getOverlayText(viewport: Locator) {
    return {
      topLeft: overlayTextFactory(viewport, 'viewport-overlay-top-left'),
      topRight: overlayTextFactory(viewport, 'viewport-overlay-top-right'),
      bottomLeft: overlayTextFactory(viewport, 'viewport-overlay-bottom-left'),
      bottomRight: overlayTextFactory(viewport, 'viewport-overlay-bottom-right'),
    };
  }

  /**
   * Hides matching elements from view by applying Tailwind's `hidden` class.
   * No-op when the locator resolves to zero elements.
   */
  private async hideLocatorElements(locator: Locator): Promise<void> {
    const count = await locator.count();
    if (count === 0) {
      return;
    }

    await locator.evaluateAll(elements => {
      elements.forEach(element => element.classList.add('hidden'));
    });
  }

  private getHideTextMethods(viewport: Locator) {
    const viewportOverlaySelector = '[data-cy^="viewport-overlay-"]';

    const demographicOverlaySelector = [
      `${viewportOverlaySelector} .overlay-item[title="Study date"]`,
      `${viewportOverlaySelector} .overlay-item[title="Series description"]`,
    ].join(', ');

    const annotationTextSelector = 'g[data-annotation-uid] text, g[data-annotation-uid] tspan';

    const hideTextMethods = {
      hideDemographicOverlayText: async () => {
        await this.hideLocatorElements(viewport.locator(demographicOverlaySelector));
      },

      hideViewportOverlayText: async () => {
        await this.hideLocatorElements(viewport.locator(viewportOverlaySelector));
      },
      hideAnnotationText: async () => {
        await this.hideLocatorElements(viewport.locator(annotationTextSelector));
      },
      // Laterality is not part of the default OHIF overlay customization.
      // This is a no-op unless the active mode explicitly adds an overlay item
      // with title="Laterality" via viewportOverlay customization.
      hideLateralityText: async () => {
        await this.hideLocatorElements(
          viewport.locator(`${viewportOverlaySelector} .overlay-item[title="Laterality"]`)
        );
      },
      hideOrientationMarkerText: async () => {
        await this.hideLocatorElements(viewport.locator('.orientation-marker'));
      },
      hideAllText: async () => {
        await hideTextMethods.hideViewportOverlayText();
        await hideTextMethods.hideAnnotationText();
        await hideTextMethods.hideOrientationMarkerText();
      },
    };

    return hideTextMethods;
  }

  private async getOverlayMenu(viewport: Locator) {
    return {
      dataOverlay: new DataOverlayPageObject(this.page, await this.getViewportId(viewport)),
      get orientation() {
        const button = viewport.locator('[data-cy^="orientationMenu"]');
        return {
          button,
          async click() {
            await button.click();
          },
        };
      },
      get windowLevel() {
        const button = viewport.locator('[data-cy^="windowLevelMenu"]');
        return {
          button,
          async click() {
            await button.click();
          },
        };
      },
    };
  }

  private getSvg(viewport: Locator, innerElement?: SvgInnerElement) {
    return viewport.locator(`svg.svg-layer${innerElement ? ` ${innerElement}` : ''}`);
  }

  private getNavigationArrows(viewport: Locator) {
    const container = viewport.getByTestId('viewport-action-arrows');
    const prevButton = viewport.getByTestId('viewport-action-arrows-left');
    const nextButton = viewport.getByTestId('viewport-action-arrows-right');
    return {
      locator: container,
      prev: {
        button: prevButton,
        click: async () => {
          await prevButton.click();
        },
      },
      next: {
        button: nextButton,
        click: async () => {
          await nextButton.click();
        },
      },
    };
  }

  /**
   * Note: awaiting the returned methods (toSlice, toFirstSlice, toLastSlice, scrollBy)
   * does not guarantee the viewport has finished rendering. Follow up with
   * `waitForViewportsRendered` if you need pixel-stable state.
   */
  private getSliceNavigation(viewport: Locator) {
    const page = this.page;

    const jumpToImage = async (imageIndex: number) => {
      const viewportId = await this.getViewportId(viewport);
      await page.evaluate(
        ({ commandsManager, viewportId, imageIndex }) => {
          return commandsManager.runCommand('jumpToImage', {
            imageIndex,
            viewport: { id: viewportId },
          });
        },
        {
          viewportId,
          imageIndex,
          commandsManager: await page.evaluateHandle('window.commandsManager'),
        }
      );
    };

    const scrollBy = async (delta: number) => {
      const viewportId = await this.getViewportId(viewport);
      await page.evaluate(
        ({ services, viewportId, delta }) => {
          const cornerstoneViewport = (
            services as any
          ).cornerstoneViewportService.getCornerstoneViewport(viewportId);
          if (!cornerstoneViewport) {
            return;
          }
          return cornerstoneViewport.scroll(delta);
        },
        {
          viewportId,
          delta,
          services: await page.evaluateHandle('window.services'),
        }
      );
    };

    return {
      toSlice: jumpToImage,
      toFirstSlice: () => jumpToImage(0),
      toLastSlice: () => jumpToImage(-1),
      scrollBy,
    };
  }

  private async viewportPageObjectFactory(viewport: Locator): Promise<IViewportPageObject> {
    return {
      nthAnnotation: (nth: number) => this.getAnnotation(viewport, nth),
      doubleClickAt: async (point: { x: number; y: number }) => {
        await simulateDoubleClickOnElement({
          locator: viewport,
          point,
        });
      },
      clickAt: async (points: { x: number; y: number }[], button?: 'left' | 'right' | 'middle') => {
        await simulateClicksOnElement({
          locator: viewport,
          points,
          button,
        });
      },
      normalizedClickAt: async (
        normalizedPoints: { x: number; y: number }[],
        button?: 'left' | 'right' | 'middle'
      ) => {
        await simulateNormalizedClicksOnElement({
          locator: viewport,
          normalizedPoints,
          button,
        });
      },
      normalizedDragAt: async (params: NormalizedDragParams) => {
        await simulateNormalizedDragOnElement({
          locator: viewport,
          start: params.start,
          end: params.end,
          button: params.config?.button,
          delay: params.config?.delay,
          steps: params.config?.steps,
        });
      },
      normalizedPathDragAt: async (params: NormalizedPathDragParams) => {
        await simulateNormalizedPathDragOnElement({
          locator: viewport,
          path: params.path,
          button: params.config?.button,
          delay: params.config?.delay,
          steps: params.config?.steps,
        });
      },
      orientationMarkers: this.getOrientationMarkers(viewport),
      overlayText: this.getOverlayText(viewport),
      overlayMenu: await this.getOverlayMenu(viewport),
      pane: viewport,
      svg: (innerElement?: SvgInnerElement) => {
        return this.getSvg(viewport, innerElement);
      },
      getSvgAnnotationStatTextLines: (uid: string) => {
        return this.getSvg(viewport).locator(`g[data-annotation-uid="${uid}"]`).locator('tspan');
      },
      navigationArrows: this.getNavigationArrows(viewport),
      sliceNavigation: this.getSliceNavigation(viewport),
      magnifyGlass: new MagnifyGlassPageObject(this.page, viewport),
      ...this.getHideTextMethods(viewport),
    };
  }

  get active(): Promise<IViewportPageObject> {
    const viewport = this.page.locator('[data-cy="viewport-pane"][data-is-active="true"]');
    return this.viewportPageObjectFactory(viewport);
  }

  get crosshairs() {
    const page = this.page;

    const crosshairHoverTimeout = 20000;

    async function getSlabHandleLocator(locator: Locator) {
      const startTime = Date.now();
      const rectLocator = locator.locator('rect').first();
      const circleLocator = locator.locator('circle').first();

      while (Date.now() - startTime < crosshairHoverTimeout) {
        if ((await rectLocator.count()) > 0) {
          return rectLocator;
        }

        if ((await circleLocator.count()) > 0) {
          return circleLocator;
        }

        await page.waitForTimeout(250);
      }

      throw new Error('Could not find slab thickness handle for crosshairs interaction');
    }

    // Drive the drag from the handle's own bounding-box center rather than the
    // async window.mouseX/Y tracker: the tracker can lag behind the hover, which
    // makes the drag start from a stale point and rotate/resize nothing. Stepped
    // moves emit intermediate mousemove events so cornerstone registers a real
    // drag instead of a single teleport (which can be dropped or mis-deltad).
    const DRAG_DISTANCE = 100;
    const DRAG_STEPS = 10;

    async function dragHandleFromCenter(handle: Locator, dx: number, dy: number) {
      const box = await handle.boundingBox();
      if (!box) {
        throw new Error('Could not resolve crosshairs handle bounding box for drag');
      }
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + dx, cy + dy, { steps: DRAG_STEPS });
      await page.mouse.up();
    }

    async function increaseSlabThickness(locator: Locator, lineNumber: number, axis: string) {
      const lineLocator = locator.locator('line').nth(lineNumber);
      await lineLocator.click({ force: true });
      await lineLocator.hover({ force: true, timeout: crosshairHoverTimeout });

      const slabHandleLocator = await getSlabHandleLocator(locator);
      await slabHandleLocator.hover({ force: true, timeout: crosshairHoverTimeout });

      const dx = axis === 'x' ? DRAG_DISTANCE : 0;
      const dy = axis === 'y' ? DRAG_DISTANCE : 0;
      await dragHandleFromCenter(slabHandleLocator, dx, dy);
    }

    async function rotateCrosshairs(locator: Locator, lineNumber: number) {
      const lineLocator = locator.locator('line').nth(lineNumber);
      await lineLocator.click({ force: true });
      await lineLocator.hover({ force: true, timeout: crosshairHoverTimeout });

      const circleLocator = locator.locator('circle').nth(1);
      await circleLocator.waitFor({ state: 'attached', timeout: crosshairHoverTimeout });
      await circleLocator.hover({ force: true, timeout: crosshairHoverTimeout });

      await dragHandleFromCenter(circleLocator, 0, DRAG_DISTANCE);
    }

    function crosshairsFactory(
      locator: Locator,
      increaseLineNumber: number,
      increaseAxis: 'x' | 'y',
      rotateLineNumber: number
    ) {
      return {
        increase: async () => {
          await increaseSlabThickness(locator, increaseLineNumber, increaseAxis);
        },
        locator,
        rotate: () => {
          return rotateCrosshairs(locator, rotateLineNumber);
        },
      };
    }

    return {
      axial: crosshairsFactory(page.locator('#svg-layer-mpr-axial'), 0, 'x', 3),
      sagittal: crosshairsFactory(page.locator('#svg-layer-mpr-sagittal'), 2, 'x', 0),
      coronal: crosshairsFactory(page.locator('#svg-layer-mpr-coronal'), 0, 'y', 0),
    };
  }

  async getAll(): Promise<IViewportPageObject[]> {
    const viewports = await this.page.getByTestId('viewport-pane').all();
    return await Promise.all(viewports.map(viewport => this.viewportPageObjectFactory(viewport)));
  }

  getNth(index: number): Promise<IViewportPageObject> {
    const viewport = this.getNthLocator(index);
    return this.viewportPageObjectFactory(viewport);
  }

  getNthLocator(index: number): Locator {
    return this.page.getByTestId('viewport-pane').nth(index);
  }

  getById(viewportId: string): Promise<IViewportPageObject> {
    const viewport = this.page.locator(
      `[data-cy="viewport-pane"]:has(div[data-viewportid="${viewportId}"])`
    );
    return this.viewportPageObjectFactory(viewport);
  }

  get grid() {
    return this.page.getByTestId('viewport-grid');
  }
}
