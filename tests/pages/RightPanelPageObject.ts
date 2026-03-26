import { Locator, Page } from '@playwright/test';

import { DOMOverlayPageObject } from './DOMOverlayPageObject';

export class RightPanelPageObject {
  readonly page: Page;
  private readonly DOMOverlayPageObject: DOMOverlayPageObject;

  constructor(page: Page) {
    this.page = page;
    this.DOMOverlayPageObject = new DOMOverlayPageObject(page);
  }

  private getCollapsedMoreMenu(typeSuffix?: string) {
    const page = this.page;
    const testId = typeSuffix
      ? `segmentation-collapsed-more-btn-${typeSuffix}`
      : 'segmentation-collapsed-more-btn';
    const button = page.getByTestId(testId);

    return {
      button,
      click: async () => {
        await button.click();
      },
      delete: async () => {
        await button.click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
      },
      rename: async (text: string) => {
        await button.click();
        await page.getByRole('menuitem', { name: 'Rename' }).click();
        await this.DOMOverlayPageObject.dialog.input.fillAndSave(text);
      },
    };
  }

  private getActionsMenu(row: Locator) {
    const actionsButton = row.getByTestId('actionsMenuTrigger');

    return {
      button: actionsButton,
      click: async () => {
        await actionsButton.click();
      },
      delete: async () => {
        await actionsButton.click();
        await this.page.getByTestId('Delete').click();
      },
      toggleLock: async () => {
        await actionsButton.click();
        await this.page.getByTestId('LockToggle').click();
      },
      unlock: async () => {
        await actionsButton.click();
        await this.page.getByTestId('Unlock').click();
      },
      rename: async (text: string) => {
        await actionsButton.click();
        await this.page.getByTestId('Rename').click();
        await this.DOMOverlayPageObject.dialog.input.fillAndSave(text);
      },
      cancelRename: async (newName?: string) => {
        await actionsButton.click();
        await this.page.getByTestId('Rename').click();
        if (newName) {
          await this.DOMOverlayPageObject.dialog.input.fillAndCancel(newName);
        } else {
          await this.DOMOverlayPageObject.dialog.input.cancel();
        }
      },
      duplicate: async () => {
        await actionsButton.click();
        await this.page.getByTestId('Duplicate').click();
      },
    };
  }

  private getPanelRowDataObject(row: Locator) {
    const getActionsMenu = (row: Locator) => this.getActionsMenu.bind(this)(row);

    return {
      get actions() {
        return getActionsMenu(row);
      },
      get title() {
        return row.getByTestId('data-row-title');
      },
      click: async () => {
        await row.click();
      },
      locator: row,
      toggleVisibility: async () => {
        await row.getByTestId('data-row-visibility-toggle').click();
      },
    };
  }

  private getPanelRowByIdx(index: number) {
    const row = this.page.getByTestId('data-row').nth(index);
    return this.getPanelRowDataObject(row);
  }

  private getPanelRowByText(text: string) {
    const row = this.page.getByTestId('data-row').filter({ hasText: text });
    return this.getPanelRowDataObject(row);
  }

  async toggle() {
    await this.page.getByTestId('side-panel-header-right').click();
  }

  get measurementsPanel() {
    const page = this.page;
    const getMeasurementByIdx = (index: number) => this.getPanelRowByIdx(index);
    const getMeasurementByText = (text: string) => this.getPanelRowByText(text);
    const menuButton = page.getByTestId('trackedMeasurements-btn');

    return {
      menuButton,
      panel: {
        deleteAll: async () => {
          await page.getByRole('button', { name: 'Delete' }).click();
        },
        getMeasurementCount: async () => {
          return await page.getByTestId('data-row').count();
        },
        locator: page.getByTestId('trackedMeasurements-panel').last(),
        nthMeasurement(index: number) {
          return getMeasurementByIdx(index);
        },
        measurementByText(text: string) {
          return getMeasurementByText(text);
        },
      },
      select: async () => {
        await menuButton.click();
      },
    };
  }

  private getSegmentationSelect(type: string) {
    const page = this.page;
    const suffix = type ? `-${type}` : '';
    const locator = page.getByTestId(`segmentation-select${suffix}`);
    const selectedValue = page.getByTestId(`segmentation-select-value${suffix}`);

    const nthSegmentation = async (n: number) => {
      await locator.click();
      return page.getByRole('option').nth(n);
    };

    return {
      /** The SelectTrigger button element */
      locator,
      /** The span showing the currently selected segmentation label */
      selectedValue,
      /** Opens the dropdown and returns a locator for the nth option (0-based) */
      nthSegmentation,
      /** Opens the dropdown and clicks the nth segmentation (0-based) */
      selectNthSegmentation: async (n: number) => {
        await (await nthSegmentation(n)).click();
      },
    };
  }

  private get addSegmentationButton() {
    const button = this.page.getByTestId('addSegmentation');
    return {
      button,
      click: async () => {
        await button.click();
      },
    };
  }

  private getSegmentsVisibilityToggle(type?: string) {
    const testId = type
      ? `all-segments-visibility-toggle-${type}`
      : 'all-segments-visibility-toggle';
    const button = this.page.getByTestId(testId);
    return {
      button,
      click: async () => {
        await button.click();
      },
    };
  }

  private getSegmentationPanel(typeSuffix?: string) {
    const page = this.page;
    const getSegmentByIdx = (index: number) => this.getPanelRowByIdx(index);
    const getSegmentByText = (text: string) => this.getPanelRowByText(text);
    const moreMenu = this.getCollapsedMoreMenu(typeSuffix);

    return {
      moreMenu,
      getSegmentCount: async () => {
        return await page.getByTestId('data-row').count();
      },
      // No data-cy exists in this panel, using Segmentation header button
      locator: page.getByRole('button', { name: 'Segmentations' }),
      nthSegment(index: number) {
        return getSegmentByIdx(index);
      },
      segmentByText(text: string) {
        return getSegmentByText(text);
      },
    };
  }

  get contourSegmentationPanel() {
    const page = this.page;
    const addSegmentationButton = this.addSegmentationButton;
    const panel = this.getSegmentationPanel('Contour');
    const menuButton = page.getByTestId('panelSegmentationWithToolsContour-btn');
    const segmentationSelect = this.getSegmentationSelect('Contour');
    const segmentsVisibilityToggle = this.getSegmentsVisibilityToggle('Contour');

    return {
      addSegmentationButton,
      menuButton,
      segmentsVisibilityToggle,
      panel,
      segmentationSelect,
      select: async () => {
        await menuButton.click();
      },
    };
  }
  get labelMapSegmentationPanel() {
    const page = this.page;
    const addSegmentationButton = this.addSegmentationButton;
    const panel = this.getSegmentationPanel('Labelmap');
    const menuButton = page.getByTestId('panelSegmentationWithToolsLabelMap-btn');
    const segmentationSelect = this.getSegmentationSelect('Labelmap');

    return {
      addSegmentationButton,
      menuButton,
      panel,
      segmentationSelect,
      select: async () => {
        await menuButton.click();
      },
      tools: {
        get brush() {
          const button = page.getByTestId('Brush-btn');
          const input = page.locator(`css=div[data-cy="brush-radius"] input`);
          return {
            button,
            input,
            click: async () => {
              await button.click();
            },
            setRadius: async (radius: number) => {
              await input.fill(radius.toString());
            },
          };
        },
        get eraser() {
          const button = page.getByTestId('Eraser-btn');
          const input = page.locator(`css=div[data-cy="eraser-radius"] input`);
          return {
            button,
            input,
            click: async () => {
              await button.click();
            },
            setRadius: async (radius: number) => {
              await input.fill(radius.toString());
            },
          };
        },
        get threshold() {
          const button = page.getByTestId('Threshold-btn');
          const input = page.locator(`css=div[data-cy="threshold-radius"] input`);
          return {
            button,
            input,
            click: async () => {
              await button.click();
            },
            setRadius: async (radius: number) => {
              await input.fill(radius.toString());
            },
          };
        },
      },

      get config() {
        const configToggle = page.getByTestId('segmentation-config-toggle-Labelmap');
        return {
          toggle: {
            locator: configToggle,
            click: async () => {
              await configToggle.click();
            },
          },

          get opacity() {
            const container = page.getByTestId('segmentation-config-opacity-Labelmap');
            return {
              input: container.locator('input'),
              slider: container.getByRole('slider'),
              fill: async (value: string) => {
                await container.locator('input').fill(value);
              },
            };
          },

          get border() {
            const container = page.getByTestId('segmentation-config-border-Labelmap');
            return {
              input: container.locator('input'),
              slider: container.getByRole('slider'),
              fill: async (value: string) => {
                await container.locator('input').fill(value);
              },
            };
          },

          get opacityInactive() {
            const container = page.getByTestId('segmentation-config-opacity-inactive-Labelmap');
            return {
              input: container.locator('input'),
              slider: container.getByRole('slider'),
              fill: async (value: string) => {
                await container.locator('input').fill(value);
              },
            };
          },
        };
      },

      get segmentBidirectional() {
        const button = page.getByTestId('SegmentBidirectional');
        return {
          button,
          click: async () => {
            await button.click();
          },
        };
      },
    };
  }

  get noToolsSegmentationPanel() {
    const page = this.page;
    const panel = this.getSegmentationPanel();
    const menuButton = page.getByTestId(/^panelSegmentation.*-btn$/).first();

    return {
      menuButton,
      panel,
      select: async () => {
        await menuButton.click();
      },
    };
  }

  get tmtvPanel() {
    const page = this.page;

    return {
      get addSegmentationButton() {
        const button = page.getByTestId('addSegmentation');
        return {
          button,
          click: async () => {
            await button.click();
          },
        };
      },
      async exportTmtvCsvReport() {
        await page.getByTestId('exportTmtvCsvReport').click();
      },
      tools: {
        get brush() {
          const button = page.getByTestId('Brush-btn');
          const input = page.locator(`css=div[data-cy="brush-radius"] input`);
          return {
            button,
            input,
            click: async () => {
              await button.click();
            },
            setRadius: async (radius: number) => {
              await input.fill(radius.toString());
            },
          };
        },
        get rectangleROIThreshold() {
          const button = page.getByTestId('RectangleROIStartEndThreshold-btn');
          const input = page.getByTestId('percentage-of-max-suv-input');
          return {
            button,
            click: async () => {
              await button.click();
            },
            getPercentageOfMaxSUV: async () => {
              return await input.inputValue();
            },
            setPercentageOfMaxSUV: async (percentage: string) => {
              await input.fill(percentage);
            },
          };
        },
      },
    };
  }

  get microscopyPanel() {
    const page = this.page;
    const getMeasurementByIdx = (index: number) => this.getPanelRowByIdx(index);
    const getMeasurementByText = (text: string) => this.getPanelRowByText(text);

    return {
      locator: page.getByTestId('measurements-panel'),
      getMeasurementCount: async () => {
        return await page.getByTestId('data-row').count();
      },
      nthMeasurement(index: number) {
        return getMeasurementByIdx(index);
      },
      measurementByText(text: string) {
        return getMeasurementByText(text);
      },
    };
  }
}
