import { Locator, Page } from '@playwright/test';
import {
  getMousePosition,
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClicksOnElement,
  simulateNormalizedDragOnElement,
} from '../utils';
import { DataOverlayPageObject } from './DataOverlayPageObject';
import { DOMOverlayPageObject } from './DOMOverlayPageObject';

type SvgInnerElement = 'circle' | 'path' | 'd';

type NormalizedDragParams = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  config?: { button?: 'left' | 'right' | 'middle'; delay?: number; steps?: number };
};

export interface IViewportPageObject {
  nthAnnotation(nth: number): {
    locator: Locator;
    click: () => Promise<void>;
    contextMenu: {
      open: () => Promise<void>;
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
    topLeft: Locator;
    topRight: Locator;
    bottomLeft: Locator;
    bottomRight: Locator;
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
}

export class ViewportPageObject {
  readonly page: Page;
  private readonly dataOverlayPageObject: DataOverlayPageObject;

  constructor(page: Page) {
    this.page = page;
    this.dataOverlayPageObject = new DataOverlayPageObject(page);
  }

  private getAnnotation(viewport: Locator, nth: number) {
    const page = this.page;
    const domOverlayPageObject = new DOMOverlayPageObject(page);
    const annotation = viewport.locator('g[data-annotation-uid]').nth(nth);

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
    };
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
      topLeft: viewport.getByTestId('viewport-overlay-top-left'),
      topRight: viewport.getByTestId('viewport-overlay-top-right'),
      bottomLeft: viewport.getByTestId('viewport-overlay-bottom-left'),
      bottomRight: viewport.getByTestId('viewport-overlay-bottom-right'),
    };
  }

  private getOverlayMenu(viewport: Locator) {
    return {
      dataOverlay: this.dataOverlayPageObject,
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

  private viewportPageObjectFactory(viewport: Locator): IViewportPageObject {
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
      overlayMenu: this.getOverlayMenu(viewport),
      pane: viewport,
      svg: (innerElement?: SvgInnerElement) => {
        return this.getSvg(viewport, innerElement);
      },
    };
  }

  get active(): IViewportPageObject {
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
    return viewports.map(viewport => this.viewportPageObjectFactory(viewport));
  }

  getNth(index: number): IViewportPageObject {
    const viewport = this.page.getByTestId('viewport-pane').nth(index);
    return this.viewportPageObjectFactory(viewport);
  }

  getById(viewportId: string): IViewportPageObject {
    const viewport = this.page.locator(
      `[data-cy="viewport-pane"]:has(div[data-viewportid="${viewportId}"])`
    );
    return this.viewportPageObjectFactory(viewport);
  }

  get grid() {
    return this.page.getByTestId('viewport-grid');
  }
}
