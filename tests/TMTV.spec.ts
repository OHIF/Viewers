import { test, expect } from '@playwright/test';
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  simulateClicksOnElement,
} from './utils/index.js';

// Extend AppTypes.Test to allow helper variables
interface TestHandle {
  window: AppTypes.Test;
  index: number;
}

// Helper function to wait for image to finish updating
const waitForRender = async page => {
  await page.evaluate(
    async ({ services }: AppTypes.Test) => {
      let vpRdy = 0;

      let resolvePromise;
      const waitForEvent = new Promise(resolve => {
        resolvePromise = resolve;
      });

      const { cornerstoneViewportService } = services;
      const { unsubscribe } = cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
        ({ viewportInfo }) => {
          vpRdy++;
          if (vpRdy >= 7) {
            // 7 Viewports in TMTV
            unsubscribe();
            resolvePromise(viewportInfo);
          }
        }
      );
      await waitForEvent;
    },
    await page.evaluateHandle('window')
  );
};

// Helper function to get SUV
const getSUV = async (page, index: number) => {
  const windowHandle = await page.evaluateHandle('window');

  // Get SUV data
  const SUV = await page.evaluate(
    ({ window, index }: TestHandle) => {
      const { services } = window;
      console.log(`index: ${index}`);
      // > Evaluate via Display Test
      const { measurementService } = services;
      const measurements = measurementService.getMeasurements();
      // index 9 then 0 for subsequents, there may be measurements that get cleared
      const displayText = measurements[index].displayText;
      return displayText[2];

      // > Evaluate via cached stats
      //const stateManager = cornerstoneTools.annotation.state.getAnnotationManager();
      //const annotations = stateManager.getAllAnnotations();
      //const stats = annotations[index].data.cachedStats; // index always 9

      //const targetIds = Object.keys(stats);
      //const targetStats = stats[targetIds[1]];
      //return targetStats.mean;
    },
    { window: windowHandle, index }
  );

  return SUV;
};

test.beforeEach(async ({ page }) => {
  // Empty for now, potentially populate if study for all
  // tests can be identified
});

// Basic TMTV Test to load
test.describe('TMTV Test', async () => {
  test('should render TMTV correctly.', async ({ page }) => {
    const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
    const mode = 'Total Metabolic Tumor Volume';
    await visitStudy(page, studyInstanceUID, mode, 2000);
    await page.waitForLoadState('networkidle');

    await checkForScreenshot(page, page, screenShotPaths.tmtv.tmtvDisplayedCorrectly);
  });
});

// Tests that SUV Re-calculates when dose parameters changed
test.describe('TMTV SUV Recalculate Test', async () => {
  test('should update SUV values correctly.', async ({ page }) => {
    const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
    const mode = 'Total Metabolic Tumor Volume';
    await visitStudy(page, studyInstanceUID, mode, 2000);
    await page.waitForLoadState('networkidle');
    await waitForRender(page);

    // Create ROI
    await page.getByTestId('petSUV-btn').click();
    await page.getByTestId('MeasurementTools-split-button-secondary').click();
    await page.getByTestId('EllipticalROI').click();
    const locator = page.getByTestId('viewport-pane').locator('canvas').first();

    await simulateClicksOnElement({
      locator,
      points: [
        {
          x: 100,
          y: 100,
        },
        {
          x: 150,
          y: 150,
        },
      ],
    });

    // Get current SUV text
    let oldSUV = await getSUV(page, 9);

    // Change PT Weight
    await page.getByTestId('input-weight-input').fill('31');
    await page.getByText('Reload Data').click();
    await waitForRender(page);

    // Get new SUV text
    let newSUV = await getSUV(page, 0);

    // Compare then store new SUV
    expect.soft(newSUV).not.toEqual(oldSUV);
    oldSUV = newSUV;

    // Change total dose
    await page
      .getByText('Patient SexWeight kgTotal')
      .locator('div')
      .filter({ hasText: /^Total Dose bq$/ })
      .getByTestId('input-undefined')
      .fill('1888020304');
    await page.getByText('Reload Data').click();
    await waitForRender(page);

    // Get new SUV
    newSUV = await getSUV(page, 0);

    // Compare then store new
    expect.soft(newSUV).not.toEqual(oldSUV);
    oldSUV = newSUV;

    // Change injection time
    await page
      .getByText('Patient SexWeight kgTotal')
      .locator('div')
      .filter({ hasText: /^Injection Time s$/ })
      .getByTestId('input-undefined')
      .fill('60000');
    await page.getByText('Reload Data').click();
    await waitForRender(page);

    // Get new SUV
    newSUV = await getSUV(page, 0);

    // Compare SUV
    expect.soft(newSUV).not.toEqual(oldSUV);
  });
});

// Check SUV Modality is PROPCNT when not calculable
test.describe('TMTV SUV Modality Unit Test', async () => {
  test('pets where SUV cannot be calculated should show same unit in TMV as in Basic.', async ({
    page,
  }) => {
    const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339';
    const mode = 'Total Metabolic Tumor Volume';
    await visitStudy(page, studyInstanceUID, mode, 2000);
    await page.waitForLoadState('networkidle');
    await waitForRender(page);

    // Change to image where SUV cannot be calculated
    await page.getByTestId('side-panel-header-left').click();
    await page
      .getByRole('button', { name: 'S: 2 311 PET NAC' })
      .dragTo(page.getByTestId('viewport-grid').locator('canvas').nth(3));

    // Add ROI annotation
    await page.getByTestId('MeasurementTools-split-button-secondary').click();
    await page.getByTestId('EllipticalROI').click();
    const locator = page.getByTestId('viewport-pane').locator('canvas').first();

    await simulateClicksOnElement({
      locator,
      points: [
        {
          x: 100,
          y: 100,
        },
        {
          x: 150,
          y: 150,
        },
      ],
    });

    const modalityUnit = await page.evaluate(
      ({ cornerstoneTools }: AppTypes.Test) => {
        const stateManager = cornerstoneTools.annotation.state.getAnnotationManager();
        const annotations = stateManager.getAllAnnotations();
        const stats = annotations[9].data.cachedStats;

        const targetIds = Object.keys(stats);
        const targetStats = stats[targetIds[1]];

        return targetStats.modalityUnit;
      },
      await page.evaluateHandle('window')
    );

    expect(modalityUnit).toEqual('PROPCNT');
  });
});

// Checks TMTV CT/PT Alignment
test.describe('TMTV CT/PT Slice alignment', async () => {
  test('PT should show slice closest to CT', async ({ page }) => {
    // Load water phantom study
    const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
    const mode = 'Total Metabolic Tumor Volume';
    await visitStudy(page, studyInstanceUID, mode, 2000);
    await page.waitForLoadState('networkidle');

    await waitForRender(page);

    const vp = page.getByTestId('viewport-pane');

    // Sagittal
    await vp.nth(1).click();
    await expect(vp.nth(1)).toContainText('257/512', { useInnerText: true }); // Should default i 257
    await expect.soft(vp.nth(4)).toContainText('97/192');
    await page.keyboard.press('ArrowUp'); // CT i 256
    await expect(vp.nth(1)).toContainText('256/512');
    await expect.soft(vp.nth(4)).toContainText('96/192');
    await page.keyboard.press('ArrowUp'); // CT i 255
    await expect(vp.nth(1)).toContainText('255/512');
    await expect.soft(vp.nth(4)).toContainText('95/192');
    await page.keyboard.press('ArrowUp'); // CT i 254
    await expect(vp.nth(1)).toContainText('254/512');
    await expect.soft(vp.nth(4)).toContainText('95/192');
    await page.keyboard.press('ArrowUp'); // CT i 253
    await expect(vp.nth(1)).toContainText('253/512');
    await expect.soft(vp.nth(4)).toContainText('94/192');
    await page.keyboard.press('ArrowUp'); // CT i 252
    await expect(vp.nth(1)).toContainText('252/512');
    await expect.soft(vp.nth(4)).toContainText('94/192');
    await page.keyboard.press('ArrowUp'); // CT i 251
    await expect(vp.nth(1)).toContainText('251/512');
    await expect.soft(vp.nth(4)).toContainText('93/192');

    // Coronal
    await vp.nth(2).click();
    await expect(vp.nth(2)).toContainText('256/512'); // Should default i 256
    await expect.soft(vp.nth(5)).toContainText('96/192');
    await page.keyboard.press('ArrowUp'); // CT i 255
    await expect(vp.nth(2)).toContainText('255/512');
    await expect.soft(vp.nth(5)).toContainText('95/192');
    await page.keyboard.press('ArrowUp'); // CT i 254
    await expect(vp.nth(2)).toContainText('254/512');
    await expect.soft(vp.nth(5)).toContainText('95/192');
    await page.keyboard.press('ArrowUp'); // CT i 253
    await expect(vp.nth(2)).toContainText('253/512');
    await expect.soft(vp.nth(5)).toContainText('94/192');
    await page.keyboard.press('ArrowUp'); // CT i 252
    await expect(vp.nth(2)).toContainText('252/512');
    await expect.soft(vp.nth(5)).toContainText('94/192');
    await page.keyboard.press('ArrowUp'); // CT i 251
    await expect(vp.nth(2)).toContainText('251/512');
    await expect.soft(vp.nth(5)).toContainText('93/192');
    await page.keyboard.press('ArrowUp'); // CT i 250
    await expect(vp.nth(2)).toContainText('250/512');
    await expect.soft(vp.nth(5)).toContainText('93/192');
  });
});
