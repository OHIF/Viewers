---
sidebar_position: 11
sidebar_label: Playwright Testing
title: Playwright End-to-End Testing
summary: Guide to writing and running end-to-end tests for OHIF Viewer using Playwright, covering test configuration, screenshot verification, simulating user interactions, accessing application services, and using the VSCode extension for test recording.
---



:::note
You might need to run `npx playwright install` the first time you set up
Playwright locally.
:::

# Running the tests

```bash
yarn test:e2e:ui
```


# Writing Playwright Tests

Our Playwright tests are written using the Playwright test framework. We use these tests to test our OHIF Viewer and ensure that it is working as expected.

In this guide, we will show you how to write Playwright tests for the OHIF Viewer.



## Using a specific study and mode

If you would like to use a specific study, you can use the `studyInstanceUID` property to reference the study you would like to visit. for example, if you would like to use the study with StudyInstanceUID `2.16.840.1.114362.1.11972228.22789312658.616067305.306.2` and the mode `Basic Viewer`, you can use the following code snippet:

```ts
import { test } from '@playwright/test';
import { visitStudy, checkForScreenshot, screenShotPaths } from './utils/index.js';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode);
});

test.describe('Some Test', async () => {
  test('should do something.', async ({ page }) => {
    // Your test code here...
  });
});

```

## Screenshots

A good way to check your tests is working as expected is to capture screenshots at different stages of the test. You can use our `checkForScreenshot` function located in `tests/utils/checkForScreenshot.ts` to capture screenshots. You should also plan your screenshots in advance, screenshots need to be defined in the `tests/utils/screenshotPaths.ts` file. For example, if you would to capture a screenshot after a measurement is added, you can define a screenshot path like this:

```ts
const screenShotPaths = {
  your_test_name: {
    measurementAdded: 'measurementAdded.png',
    measurementRemoved: 'measurementRemoved.png',
  },
};
```

It's okay if the screenshot doesn't exist yet, this will be dealt with in the next step. Once you have defined your screenshot path, you can use the `checkForScreenshot` function in your test to capture the screenshot. For example, if you would like to capture a screenshot of the page after a measurement is added, you can use the following code snippet:

```ts
import { test } from '@playwright/test';
import {
  visitStudy,
  checkForScreenshot,
  screenshotPath,
} from './utils/index.js';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode);
});

test.describe('Some test', async () => {
  test('should do something', async ({ page }) => {
    // Your test code here to add a measurement
    await checkForScreenshot(
      page,
      page,
      screenshotPath.your_test_name.measurementAdded
    );
  });
});
```

The test will automatically fail the first time you run it, but it will also
generate the missing screenshot for you. In the current default configuration,
that snapshot will be written under
`tests/screenshots/chromium/your-test.spec.ts/measurementAdded.png`. If you
enable additional browser projects in `playwright.config.ts`, Playwright will
create matching snapshots for those projects as well. Please verify that the
ground-truth screenshots are correct before committing them or testing against
them.

## Simulating mouse drags

If you would like to simulate a mouse drag, you can use the `simulateDrag` function located in `tests/utils/simulateDrag.ts`. You can use this function to simulate a mouse drag on an element. For example, if you would like to simulate a mouse drag on the `cornerstone-canvas` element, you can use the following code snippet:

```ts
import {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  simulateDrag,
} from './utils/index.js';

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
  const mode = 'Basic Viewer';
  await visitStudy(page, studyInstanceUID, mode);
});

test.describe('Some Test', async () => {
  test('should do something..', async ({
    page,
  }) => {
    const locator = page.locator('.cornerstone-canvas');
    await simulateDrag(page, locator);
  });
});
```

Our simulate drag utility can simulate a drag on any element, and avoid going out of bounds. It will calculuate the bounding box of the element and ensure that the drag stays within the bounds of the element. This should be good enough for most tools, and better than providing custom x, and y coordinates which can be error prone and make the code difficult to maintain.

## Running the tests

After you have written your tests, you can run them by using the following
command:

```bash
yarn test:e2e:ci
```

If you want to use headed mode, you can use the following command:

```bash
yarn test:e2e:headed
```

You will see the test results in your terminal. If you want a more detailed
report, you can use the following command:

```bash
npx playwright show-report tests/playwright-report
```

## Serving the viewer manually for development

By default, Playwright starts the viewer for you using the e2e configuration in
`playwright.config.ts`. If you would like to serve the viewer manually while you
iterate on a test, run:

```bash
npx cross-env APP_CONFIG=config/e2e.js OHIF_PORT=3335 yarn start
```

The viewer will then be available at `http://localhost:3335`, which matches the
default Playwright base URL. When that server is already running, Playwright
will reuse it instead of starting a new one.

## Accessing services, managers, configs and cornerstone in your tests

If you would like to access the cornerstone3D, services, or command managers in your tests, you can use the `page.evaluate` function to access them. For example, if you would like to access the `services` so you can show a UI notifcation using the uiNotifcationService, you can use the following code snippet:

```ts
  await page.evaluate(({ services }: AppTypes.Test) => {
    const { uiNotificationService } = services;
    uiNotificationService.show({
      title: 'Test',
      message: 'This is a test',
      type: 'info',
    });
  }, await page.evaluateHandle('window'));
 ```

## Writing Playwright Tests

The following video is an example for adding a `Playwright` test to OHIF.


<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/949191936?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
    frameBorder="0" allow="cross-origin-isolated" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="Playwright Extension"></iframe>
</div>
