import { Page } from '@playwright/test';

export class MainToolbarPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get layoutSection() {
    const page = this.page;

    const layoutSection = {
      button: page.getByTestId('Layout'),
      async click() {
        await page.getByTestId('Layout').click();
      },
    };

    return {
      ...layoutSection,
      get axialPrimary() {
        return {
          button: page.getByTestId('Axial Primary'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('Axial Primary').click();
          },
        };
      },
      get MPR() {
        return {
          button: page.getByTestId('MPR'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('MPR').click();
          },
        };
      },
      get threeDFourUp() {
        return {
          button: page.getByTestId('3D four up'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('3D four up').click();
          },
        };
      },
      get threeDMain() {
        return {
          button: page.getByTestId('3D main'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('3D main').click();
          },
        };
      },
      get threeDOnly() {
        return {
          button: page.getByTestId('3D only'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('3D only').click();
          },
        };
      },
      get threeDPrimary() {
        return {
          button: page.getByTestId('3D primary'),
          async click() {
            await layoutSection.click();
            await page.getByTestId('3D primary').click();
          },
        };
      },
    };
  }

  get measurementTools() {
    const page = this.page;

    const measurementTools = {
      button: page.getByTestId('MeasurementTools-split-button-secondary'),
      async click() {
        await page.getByTestId('MeasurementTools-split-button-secondary').click();
      },
    };

    return {
      ...measurementTools,
      get arrowAnnotate() {
        return {
          button: page.getByTestId('ArrowAnnotate'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('ArrowAnnotate').click();
          },
        };
      },
      get bidirectional() {
        return {
          button: page.getByTestId('Bidirectional'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('Bidirectional').click();
          },
        };
      },
      get circleROI() {
        return {
          button: page.getByTestId('CircleROI'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('CircleROI').click();
          },
        };
      },
      get ellipticalROI() {
        return {
          button: page.getByTestId('EllipticalROI'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('EllipticalROI').click();
          },
        };
      },
      get length() {
        return {
          button: page.locator('[data-cy="Length"][role="menuitem"]'),
          async click() {
            await measurementTools.click();
            await page.locator('[data-cy="Length"][role="menuitem"]').click();
          },
        };
      },
      get livewireContour() {
        return {
          button: page.getByTestId('LivewireContour'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('LivewireContour').click();
          },
        };
      },
      get rectangleROI() {
        return {
          button: page.getByTestId('RectangleROI'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('RectangleROI').click();
          },
        };
      },
      get splineROI() {
        return {
          button: page.getByTestId('SplineROI'),
          async click() {
            await measurementTools.click();
            await page.getByTestId('SplineROI').click();
          },
        };
      },
    };
  }

  get moreTools() {
    const page = this.page;

    const moreTools = {
      button: page.getByTestId('MoreTools-split-button-secondary'),
      async click() {
        await page.getByTestId('MoreTools-split-button-secondary').click();
      },
    };

    return {
      ...moreTools,
      get angle() {
        return {
          button: page.getByTestId('Angle'),
          async click() {
            await moreTools.click();
            await page.getByTestId('Angle').click();
          },
        };
      },
      get cobbAngle() {
        return {
          button: page.getByTestId('CobbAngle'),
          async click() {
            await moreTools.click();
            await page.getByTestId('CobbAngle').click();
          },
        };
      },
      get flipHorizontal() {
        return {
          button: page.getByTestId('flipHorizontal'),
          async click() {
            await moreTools.click();
            await page.getByTestId('flipHorizontal').click();
          },
        };
      },
      get invert() {
        return {
          button: page.getByTestId('invert'),
          async click() {
            await moreTools.click();
            await page.getByTestId('invert').click();
          },
        };
      },
      get probe() {
        return {
          button: page.getByTestId('Probe'),
          async click() {
            await moreTools.click();
            await page.getByTestId('Probe').click();
          },
        };
      },
      get reset() {
        return {
          button: page.locator('[data-cy="Reset"][role="menuitem"]'),
          async click() {
            await moreTools.click();
            await page.locator('[data-cy="Reset"][role="menuitem"]').click();
          },
        };
      },
      get rotateRight() {
        return {
          button: page.getByTestId('rotate-right'),
          async click() {
            await moreTools.click();
            await page.getByTestId('rotate-right').click();
          },
        };
      },
      get tagBrowser() {
        return {
          button: page.getByTestId('TagBrowser'),
          async click() {
            await moreTools.click();
            await page.getByTestId('TagBrowser').click();
          },
        };
      },
    };
  }

  get panTool() {
    return {
      button: this.page.getByTestId('Pan'),
      async click() {
        await this.page.getByTestId('Pan').click();
      },
    };
  }
}
