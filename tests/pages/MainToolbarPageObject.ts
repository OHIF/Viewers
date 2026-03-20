import { Page } from '@playwright/test';
import { CLICK_NO_NAV_WAIT } from '../utils/clickOptions';

export type WaitForLoadOptions = {
  viewportId?: string;
  viewportType?: 'stack' | 'orthographic' | 'volume3d';
  sopInstanceUID?: string;
  frameNumber?: number;
  isVolume?: boolean;
  imageTimeout?: number;
  volumeTimeout?: number;
};

const DEFAULT_IMAGE_TIMEOUT = 10_000;
const DEFAULT_VOLUME_TIMEOUT = 120_000;

/** Default series UID selected for 3D four up and 3D main layouts (HCC-TACE-Seg study). */
export const DEFAULT_3D_SERIES_UID =
  '1.3.6.1.4.1.14519.5.2.1.1706.8374.353297340939839941169758740949';

export class MainToolbarPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForVolumeLoad(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle', { timeout: 120000 });
  }

  /**
   * Gets the series instance UID from the first active display set.
   * Useful when the series is determined by the hanging protocol (e.g. first reconstructable).
   */
  async getActiveSeriesInstanceUID(): Promise<string | undefined> {
    return this.page.evaluate(() => {
      const win = globalThis as unknown as {
        services?: {
          displaySetService?: { getActiveDisplaySets?: () => { SeriesInstanceUID?: string }[] };
        };
      };
      const displaySets = win.services?.displaySetService?.getActiveDisplaySets?.();
      return displaySets?.[0]?.SeriesInstanceUID;
    });
  }

  /**
   * Waits for a viewport to have the given series loaded and optionally for
   * volume load, specific SOP instance, or frame to be rendered.
   *
   * @param seriesInstanceUID - Required. Wait for any viewport (or the specified viewportId) to have this series loaded.
   * @param options - Optional. viewportId, sopInstanceUID, frameNumber, isVolume, and timeout overrides.
   */
  async waitForLoad(seriesInstanceUID: string, options?: WaitForLoadOptions): Promise<void> {
    const {
      viewportId,
      viewportType,
      sopInstanceUID,
      frameNumber,
      isVolume = false,
      imageTimeout = DEFAULT_IMAGE_TIMEOUT,
      volumeTimeout = DEFAULT_VOLUME_TIMEOUT,
    } = options ?? {};

    const waitForVolume = isVolume || viewportType === 'volume3d';
    const timeout = waitForVolume ? volumeTimeout : imageTimeout;

    await this.page.waitForFunction(
      (args: {
        seriesInstanceUID: string;
        viewportId?: string;
        viewportType?: 'stack' | 'orthographic' | 'volume3d';
        sopInstanceUID?: string;
        frameNumber?: number;
        isVolume?: boolean;
      }) => {
        const win = globalThis as unknown as { cornerstone?: typeof import('@cornerstonejs/core') };
        const cornerstone = win.cornerstone;
        if (!cornerstone) return false;

        const metaData = cornerstone.metaData;
        const ViewportStatus = cornerstone.Enums?.ViewportStatus;
        const RENDERED = ViewportStatus?.RENDERED;

        const getViewports = () => {
          if (args.viewportId) {
            try {
              const el = cornerstone.getEnabledElementByViewportId(args.viewportId);
              return el ? [el] : [];
            } catch {
              return [];
            }
          }
          return cornerstone.getEnabledElements();
        };

        let viewports = getViewports();
        if (args.viewportType) {
          viewports = viewports.filter(ee => ee.viewport?.type === args.viewportType);
        }
        if (viewports.length === 0) return false;

        const viewportsWithSeries = viewports.filter(ee => {
          const vp = ee.viewport;
          if (!vp) return false;

          const status = (vp as { viewportStatus?: unknown }).viewportStatus;
          if (RENDERED != null && status !== RENDERED) return false;

          let vpSeriesUID: string | undefined;
          try {
            if (vp.type === 'stack') {
              const imageIds = vp.getImageIds?.();
              if (!imageIds?.length) return false;
              const meta = metaData?.get?.('generalSeriesModule', imageIds[0]);
              vpSeriesUID = meta?.seriesInstanceUID;
            } else if (vp.type === 'orthographic' || vp.type === 'volume3d') {
              const imageData = vp.getImageData?.();
              if ((args.isVolume || args.viewportType === 'volume3d') && !imageData) return false;
              const imageIds = vp.getImageIds?.();
              if (!imageIds?.length) return false;
              const meta = metaData?.get?.('generalSeriesModule', imageIds[0]);
              vpSeriesUID = meta?.seriesInstanceUID;
            } else {
              return false;
            }
          } catch {
            return false;
          }

          if (vpSeriesUID !== args.seriesInstanceUID) return false;

          if (args.sopInstanceUID) {
            try {
              const currentId = vp.getCurrentImageId?.();
              if (!currentId) return false;
              const sopMeta = metaData?.get?.('sopCommonModule', currentId);
              if (sopMeta?.sopInstanceUID !== args.sopInstanceUID) return false;
            } catch {
              return false;
            }
          }

          if (args.frameNumber != null) {
            try {
              const idx = vp.getCurrentImageIdIndex?.();
              if (idx == null) return false;
              const frameIdx = args.frameNumber - 1;
              if (idx !== frameIdx) return false;
            } catch {
              return false;
            }
          }

          return true;
        });

        return viewportsWithSeries.length > 0;
      },
      {
        seriesInstanceUID,
        viewportId,
        viewportType,
        sopInstanceUID,
        frameNumber,
        isVolume,
      },
      { timeout }
    );
  }

  get crosshairs() {
    const button = this.page.getByTestId('Crosshairs');
    return {
      button,
      async click() {
        await button.click(CLICK_NO_NAV_WAIT);
      },
    };
  }
  get layoutSelection() {
    const page = this.page;
    const self = this;

    const button = page.getByTestId('Layout');
    const layoutSelection = {
      button,
      async click() {
        await button.click(CLICK_NO_NAV_WAIT);
      },
    };

    return {
      ...layoutSelection,
      get axialPrimary() {
        const button = page.getByTestId('Axial Primary');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get MPR() {
        const button = page.getByTestId('MPR');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
            await self.waitForVolumeLoad();
          },
        };
      },
      get threeDFourUp() {
        const button = page.getByTestId('3D four up');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
            await self.waitForLoad(DEFAULT_3D_SERIES_UID, { viewportType: 'volume3d' });
          },
        };
      },
      get threeDMain() {
        const button = page.getByTestId('3D main');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
            await self.waitForLoad(DEFAULT_3D_SERIES_UID, { viewportType: 'volume3d' });
          },
        };
      },
      get threeDOnly() {
        const button = page.getByTestId('3D only');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
            await self.waitForVolumeLoad();
          },
        };
      },
      get threeDPrimary() {
        const button = page.getByTestId('3D primary');
        return {
          button,
          async click() {
            await layoutSelection.click();
            await button.click(CLICK_NO_NAV_WAIT);
            await self.waitForVolumeLoad();
          },
        };
      },
    };
  }

  get measurementTools() {
    const page = this.page;

    const button = page.getByTestId('MeasurementTools-split-button-secondary');
    const measurementTools = {
      button,
      async click() {
        await button.click(CLICK_NO_NAV_WAIT);
      },
    };

    return {
      ...measurementTools,
      get selectedTool() {
        const button = page.getByTestId('MeasurementTools-split-button-primary');
        return {
          button,
          async click() {
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get arrowAnnotate() {
        const button = page.getByTestId('ArrowAnnotate');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get bidirectional() {
        const button = page.getByTestId('Bidirectional');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get circleROI() {
        const button = page.getByTestId('CircleROI');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get ellipticalROI() {
        const button = page.getByTestId('EllipticalROI');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get length() {
        const button = page.locator('[data-cy="Length"][role="menuitem"]');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get livewireContour() {
        const button = page.getByTestId('LivewireContour');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get rectangleROI() {
        const button = page.getByTestId('RectangleROI');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get splineROI() {
        const button = page.getByTestId('SplineROI');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get freehandROI() {
        const button = page.getByTestId('PlanarFreehandROI');
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      /* microscopy specific tools */
      // `.last()` targets the menu item inside the dropdown, not the active-tool
      // indicator inside the split-button primary
      // because both share the same data-cy value (e.g. "line")
      // Other microscopy tools might follow the same pattern
      get line() {
        const button = page.getByTestId('line').last();
        return {
          button,
          async click() {
            await measurementTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
    };
  }

  get moreTools() {
    const page = this.page;

    const button = page.getByTestId('MoreTools-split-button-secondary');
    const moreTools = {
      button,
      async click() {
        await button.click(CLICK_NO_NAV_WAIT);
      },
    };

    return {
      ...moreTools,
      get angle() {
        const button = page.getByTestId('Angle');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get cobbAngle() {
        const button = page.getByTestId('CobbAngle');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get flipHorizontal() {
        const button = page.getByTestId('flipHorizontal');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get invert() {
        const button = page.getByTestId('invert');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get probe() {
        const button = page.getByTestId('Probe');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get reset() {
        const button = page.locator('[data-cy="Reset"][role="menuitem"]');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get rotateRight() {
        const button = page.getByTestId('rotate-right');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
      get tagBrowser() {
        const button = page.getByTestId('TagBrowser');
        return {
          button,
          async click() {
            await moreTools.click();
            await button.click(CLICK_NO_NAV_WAIT);
          },
        };
      },
    };
  }

  get panTool() {
    const button = this.page.getByTestId('Pan');
    return {
      button,
      async click() {
        await button.click(CLICK_NO_NAV_WAIT);
      },
    };
  }
}
