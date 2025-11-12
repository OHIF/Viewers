import { Locator, Page } from '@playwright/test';
import {
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClicksOnElement,
  simulateNormalizedDragOnElement,
} from '../utils';

type SvgInnerElement = 'circle' | 'path' | 'd';

type NormalizedDragParams = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  config?: { button?: 'left' | 'right' | 'middle'; delay?: number; steps?: number };
};

export interface IViewportPageObject {
  doubleClickOn: (point: { x: number; y: number }) => Promise<void>;
  clicksOn: (
    points: { x: number; y: number }[],
    button?: 'left' | 'right' | 'middle'
  ) => Promise<void>;
  normalizedClicksOn: (
    normalizedPoints: { x: number; y: number }[],
    button?: 'left' | 'right' | 'middle'
  ) => Promise<void>;
  normalizedDragOn: (params: NormalizedDragParams) => Promise<void>;
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
    dataOverlay: {
      button: Locator;
      click: () => Promise<void>;
    };
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

  constructor(page: Page) {
    this.page = page;
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
      get dataOverlay() {
        const button = viewport.locator('[data-cy^="dataOverlayMenu"]');
        return {
          button,
          async click() {
            await button.click();
          },
        };
      },
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

  public viewportPageObjectFactory(viewport: Locator): IViewportPageObject {
    return {
      doubleClickOn: async (point: { x: number; y: number }) => {
        await simulateDoubleClickOnElement({
          locator: viewport,
          point,
        });
      },
      clicksOn: async (
        points: { x: number; y: number }[],
        button?: 'left' | 'right' | 'middle'
      ) => {
        await simulateClicksOnElement({
          locator: viewport,
          points,
          button,
        });
      },
      normalizedClicksOn: async (
        normalizedPoints: { x: number; y: number }[],
        button?: 'left' | 'right' | 'middle'
      ) => {
        await simulateNormalizedClicksOnElement({
          locator: viewport,
          normalizedPoints,
          button,
        });
      },
      normalizedDragOn: async (params: NormalizedDragParams) => {
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

  async getAll(): Promise<IViewportPageObject[]> {
    const viewports = await this.page.getByTestId('viewport-pane').all();
    return viewports.map(viewport => this.viewportPageObjectFactory(viewport));
  }

  getNth(index: number): IViewportPageObject {
    const viewport = this.page.getByTestId('viewport-pane').nth(index);
    return this.viewportPageObjectFactory(viewport);
  }

  getById(viewportId: string): IViewportPageObject {
    const viewport = this.page.locator(`css=div[data-viewportid="${viewportId}"]`);
    return this.viewportPageObjectFactory(viewport);
  }

  get grid() {
    return this.page.getByTestId('viewport-grid');
  }
}
