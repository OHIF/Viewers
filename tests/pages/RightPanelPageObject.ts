import { Locator, Page } from '@playwright/test';

import { DOMOverlayPageObject } from './DOMOverlayPageObject';

export class RightPanelPageObject {
  readonly page: Page;
  private readonly DOMOverlayPageObject: DOMOverlayPageObject;

  constructor(page: Page) {
    this.page = page;
    this.DOMOverlayPageObject = new DOMOverlayPageObject(page);
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
    };
  }

  private getPanelRowDataObject(row: Locator) {
    const getActionsMenu = (row: Locator) => this.getActionsMenu.bind(this)(row);

    return {
      get actions() {
        return getActionsMenu(row);
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

  private get addSegmentationButton() {
    const button = this.page.getByTestId('addSegmentation');
    return {
      button,
      click: async () => {
        await button.click();
      },
    };
  }

  private get segmentationPanel() {
    const page = this.page;
    const getSegmentByIdx = (index: number) => this.getPanelRowByIdx(index);
    const getSegmentByText = (text: string) => this.getPanelRowByText(text);

    return {
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
    const panel = this.segmentationPanel;
    const menuButton = page.getByTestId('panelSegmentationWithToolsContour-btn');

    return {
      addSegmentationButton,
      menuButton,
      panel,
      select: async () => {
        await menuButton.click();
      },
    };
  }
  get labelMapSegmentationPanel() {
    const page = this.page;
    const addSegmentationButton = this.addSegmentationButton;
    const panel = this.segmentationPanel;
    const menuButton = page.getByTestId('panelSegmentationWithToolsLabelMap-btn');

    return {
      addSegmentationButton,
      menuButton,
      panel,
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
    };
  }

  get noToolsSegmentationPanel() {
    const page = this.page;
    const panel = this.segmentationPanel;
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
}
