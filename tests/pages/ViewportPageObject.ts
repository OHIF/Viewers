import { Locator, Page } from '@playwright/test';
import {
  applyViewportScreenshotStabilization,
  assertViewportOverlayText,
  checkForScreenshot,
  defaultOverlayScreenshotStabilization,
  getMousePosition,
  restoreViewportScreenshotStabilization,
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClicksOnElement,
  simulateNormalizedDragOnElement,
} from '../utils';
import type { ViewportScreenshotStabilization } from '../utils';
import { DataOverlayPageObject } from './DataOverlayPageObject';
import { DOMOverlayPageObject } from './DOMOverlayPageObject';

type SvgInnerElement = 'circle' | 'path' | 'd';

type NormalizedDragParams = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  config?: { button?: 'left' | 'right' | 'middle'; delay?: number; steps?: number };
};

type ViewportScreenshotOptions = {
  attempts?: number;
  delay?: number;
  maxDiffPixelRatio?: number;
  threshold?: number;
  normalizedClip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fullPage?: boolean;
  /** Forwarded to Playwright `locator.screenshot({ timeout })`. Default 5000 in {@link checkForScreenshot}. */
  screenshotTimeout?: number;
  locator?: Locator;
  hideSelectors?: string[];
  /**
   * When set, stabilizes listed overlay rows and/or SVG annotation text boxes before each
   * screenshot attempt (purple placeholder boxes, transparent text). Omitted fields unchanged.
   * @default {@link defaultOverlayScreenshotStabilization}
   */
  stabilization?: ViewportScreenshotStabilization;
};

export interface IOverlayText {
  get windowLevel(): Locator;
  get instanceNumber(): Locator;
}
function overlayTextFactory(viewport: Locator, id: string): IOverlayText {
  const locator = viewport.getByTestId(id);
  return {
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
}

export class ViewportPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async checkForScreenshot(
    screenshotPath: string | string[],
    {
      locator,
      hideSelectors = ['[data-testid="viewport-action-arrows"]'],
      stabilization = defaultOverlayScreenshotStabilization,
      ...options
    }: ViewportScreenshotOptions = {}
  ) {
    const screenshotLocator = locator ?? this.grid;

    if (stabilization) {
      await assertViewportOverlayText(this.page, stabilization);
    }

    await this.page.evaluate(selectors => {
      selectors.forEach(selector => {
        document.querySelectorAll<HTMLElement>(selector).forEach(element => {
          if (!element.hasAttribute('data-screenshot-prev-visibility')) {
            element.setAttribute('data-screenshot-prev-visibility', element.style.visibility || '');
          }
          element.style.visibility = 'hidden';
        });
      });
    }, hideSelectors);

    try {
      await checkForScreenshot({
        page: this.page,
        locator: screenshotLocator,
        screenshotPath,
        ...options,
        beforeScreenshot: stabilization
          ? async () => {
              await restoreViewportScreenshotStabilization(this.page);
              await applyViewportScreenshotStabilization(this.page, stabilization);
            }
          : undefined,
      });
    } finally {
      await restoreViewportScreenshotStabilization(this.page);
      await this.page.evaluate(selectors => {
        selectors.forEach(selector => {
          document.querySelectorAll<HTMLElement>(selector).forEach(element => {
            const previousVisibility = element.getAttribute('data-screenshot-prev-visibility');
            if (previousVisibility !== null) {
              element.style.visibility = previousVisibility;
              element.removeAttribute('data-screenshot-prev-visibility');
            }
          });
        });
      }, hideSelectors);
    }
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
      orientationMarkers: this.getOrientationMarkers(viewport),
      overlayText: this.getOverlayText(viewport),
      overlayMenu: await this.getOverlayMenu(viewport),
      pane: viewport,
      svg: (innerElement?: SvgInnerElement) => {
        return this.getSvg(viewport, innerElement);
      },
      navigationArrows: this.getNavigationArrows(viewport),
    };
  }

  get active(): Promise<IViewportPageObject> {
    const viewport = this.page.locator('[data-cy="viewport-pane"][data-is-active="true"]');
    return this.viewportPageObjectFactory(viewport);
  }

  get crosshairs() {
    const page = this.page;

    async function increaseSlabThickness(locator: Locator, lineNumber: number, axis: string) {
      const lineLocator = locator.locator('line').nth(lineNumber);
      await lineLocator.click({ force: true });
      await lineLocator.hover({ force: true });

      const circleLocator = locator.locator('rect').first();
      await circleLocator.hover({ force: true });

      await page.mouse.down();

      const position = await getMousePosition(page);
      switch (axis) {
        case 'x':
          await page.mouse.move(position.x + 100, position.y);
          break;
        case 'y':
          await page.mouse.move(position.x, position.y + 100);
          break;
      }
      await page.mouse.up();
    }

    async function rotateCrosshairs(locator: Locator, lineNumber: number) {
      const lineLocator = locator.locator('line').nth(lineNumber);
      await lineLocator.click({ force: true });
      await lineLocator.hover({ force: true });

      const circleLocator = locator.locator('circle').nth(1);
      await circleLocator.hover({ force: true });

      await page.mouse.down();

      const position = await getMousePosition(page);
      await page.mouse.move(position.x, position.y + 100);
      await page.mouse.up();
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
