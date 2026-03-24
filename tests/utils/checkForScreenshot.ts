import { test } from 'playwright-test-coverage';
import type { TestInfo } from '@playwright/test';
import { Locator, Page } from 'playwright';
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { getComparator } from 'playwright-core/lib/utils';

type CheckForScreenshotProps = {
  page: Page;
  locator?: Locator | Page;
  /** One baseline, or several tried in order until one matches (e.g. Linux vs Windows GPU). */
  screenshotPath: string | string[];
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
  /** Runs before each screenshot capture (including each retry attempt). */
  beforeScreenshot?: () => Promise<void>;
};

/** GitHub Actions: re-run with debug logging sets these (runner / step / diagnostic). */
function isGithubActionsScreenshotDebug(): boolean {
  const e = process.env;
  return (
    e.RUNNER_DEBUG === '1' ||
    e.ACTIONS_RUNNER_DEBUG === 'true' ||
    e.ACTIONS_STEP_DEBUG === 'true'
  );
}

async function writeComparisonArtifacts(
  testInfo: TestInfo,
  screenshotFileName: string,
  actual: Buffer,
  expected: Buffer,
  diff: Buffer | undefined
): Promise<void> {
  const outBase = testInfo.outputPath(screenshotFileName);
  const ext = path.extname(outBase);
  const base = outBase.slice(0, -ext.length);
  await fs.mkdir(path.dirname(outBase), { recursive: true });
  await fs.writeFile(`${base}-actual${ext}`, actual);
  await fs.writeFile(`${base}-expected${ext}`, expected);
  if (diff?.length) {
    await fs.writeFile(`${base}-diff${ext}`, diff);
  }
}

/**
 * One screenshot capture per attempt; compare against each baseline in order.
 * Writes actual/expected/diff under tests/test-results when:
 * - GitHub debug logging is enabled: every failed baseline comparison in that attempt
 * - otherwise: only on the last attempt, one triple for the primary baseline (paths[0])
 */
async function runScreenshotCheckAttempt(
  locator: Locator | Page,
  paths: string[],
  options: {
    maxDiffPixelRatio: number;
    threshold: number;
    clip?: { x: number; y: number; width: number; height: number };
    fullPage: boolean;
    beforeScreenshot?: () => Promise<void>;
  },
  attemptIndex: number,
  totalAttempts: number
): Promise<void> {
  const testInfo = test.info();
  const updateSnapshots = testInfo.config.updateSnapshots;
  const debugAllFailures = isGithubActionsScreenshotDebug();
  const writeOneOnFinalFailure = attemptIndex === totalAttempts - 1 && !debugAllFailures;

  if (options.beforeScreenshot) {
    await options.beforeScreenshot();
  }

  const screenshotOptions = {
    animations: 'disabled' as const,
    caret: 'hide' as const,
    clip: options.clip,
    fullPage: options.fullPage,
    scale: 'css' as const,
    timeout: 5000,
  };

  const actual = await locator.screenshot(screenshotOptions);
  const comparator = getComparator('image/png');
  const cmpOpts = {
    threshold: options.threshold,
    maxDiffPixelRatio: options.maxDiffPixelRatio,
  };

  let lastError: Error | undefined;
  let primaryMismatch: {
    expected: Buffer;
    diff?: Buffer;
  } | null = null;

  for (let pi = 0; pi < paths.length; pi++) {
    const p = paths[pi];
    const expectedPath = testInfo.snapshotPath(p, { kind: 'screenshot' });
    const expectedExists = existsSync(expectedPath);

    if (!expectedExists) {
      if (updateSnapshots === 'none') {
        throw new Error(`A snapshot doesn't exist at ${expectedPath}.`);
      }
      await fs.mkdir(path.dirname(expectedPath), { recursive: true });
      await fs.writeFile(expectedPath, actual);
      return;
    }

    const expected = await fs.readFile(expectedPath);
    const cmpResult = comparator(actual, expected, cmpOpts);

    if (!cmpResult) {
      return;
    }

    if (updateSnapshots === 'all' || updateSnapshots === 'changed') {
      await fs.writeFile(expectedPath, actual);
      return;
    }

    lastError = new Error(
      `Screenshot comparison failed for ${p}: ${cmpResult.errorMessage ?? 'unknown'}`
    );

    if (pi === 0) {
      primaryMismatch = { expected, diff: cmpResult.diff };
    }

    if (debugAllFailures) {
      await writeComparisonArtifacts(testInfo, p, actual, expected, cmpResult.diff);
    }
  }

  if (writeOneOnFinalFailure && primaryMismatch) {
    await writeComparisonArtifacts(
      testInfo,
      paths[0],
      actual,
      primaryMismatch.expected,
      primaryMismatch.diff
    );
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Screenshot comparison failed');
}

const _checkForScreenshot = async (props: CheckForScreenshotProps) => {
  const {
    page,
    screenshotPath,
    attempts = 10,
    delay = 500,
    maxDiffPixelRatio = 0.02,
    threshold = 0.05,
    normalizedClip,
    fullPage = false,
    beforeScreenshot,
  } = props;

  const paths = Array.isArray(screenshotPath) ? screenshotPath : [screenshotPath];
  if (paths.length === 0) {
    throw new Error('checkForScreenshot requires at least one screenshotPath');
  }

  let { locator = page } = props;

  await page.waitForLoadState('networkidle');

  for (let i = 0; i < attempts; i++) {
    try {
      let clip: { x: number; y: number; width: number; height: number } | undefined;
      if (normalizedClip) {
        let boundingBox;
        if (locator === page) {
          boundingBox = { x: 0, y: 0, ...(await page.viewportSize()) };
        } else {
          boundingBox = await (locator as Locator).boundingBox();

          // clip does not work for locator screen shots, so lets do some trickery
          // set page as the locator here and below add the locator bounding box origin to the
          // clip area
          locator = page;
        }

        clip = {
          x: boundingBox.x + normalizedClip.x * boundingBox.width,
          y: boundingBox.y + normalizedClip.y * boundingBox.height,
          width: normalizedClip.width * boundingBox.width,
          height: normalizedClip.height * boundingBox.height,
        };
      }

      await runScreenshotCheckAttempt(
        locator,
        paths,
        { maxDiffPixelRatio, threshold, clip, fullPage, beforeScreenshot },
        i,
        attempts
      );
      return true;
    } catch (error) {
      if (i === attempts - 1) {
        console.debug('Screenshot comparison failed after all attempts');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Screenshot comparison failed: loop exited without match or proper error');
};

/**
 * Checks if a screenshot of a specific element matches the expected screenshot.
 * It retries the check for a specified number of attempts with a delay between each attempt.
 * By default, the number of attempts is 10 and the delay is 500 milliseconds which results in a maximum wait time of 5 seconds.
 * On failure, actual/expected/diff are written under tests/test-results only on the final attempt (one set for the primary baseline),
 * or on every failed baseline when GitHub Actions debug logging is enabled (RUNNER_DEBUG=1, ACTIONS_RUNNER_DEBUG=true, or ACTIONS_STEP_DEBUG=true).
 * Baseline updates (--update-snapshots) write only to tests/screenshots/...
 * @param pageOrProps - The page to interact with or an object containing page and other properties
 * @param locator - The element to check for screenshot
 * @param screenshotPath - Baseline filename(s). A single string, or multiple strings tried in order until one matches.
 * @param attempts - The number of attempts to check for screenshot
 * @param delay - The delay between attempts
 * @returns  True if the screenshot matches, otherwise throws an error
 */
const checkForScreenshot = async (
  pageOrProps: Page | CheckForScreenshotProps,
  locator?: Locator | Page,
  screenshotPath?: string | string[],
  attempts?: number,
  delay?: number
) => {
  if (typeof pageOrProps === 'object' && 'page' in pageOrProps) {
    return await _checkForScreenshot(pageOrProps as CheckForScreenshotProps);
  } else {
    return await _checkForScreenshot({
      page: pageOrProps as Page,
      locator,
      screenshotPath: screenshotPath as string | string[],
      attempts,
      delay,
    });
  }
};

export { checkForScreenshot };
