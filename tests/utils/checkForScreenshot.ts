import { expect } from 'playwright-test-coverage';
import { Locator, Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

type CheckForScreenshotProps = {
  page: Page;
  locator?: Locator | Page;
  screenshotPath: string;
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
};

const ARTIFACT_DIR = 'test-results';

function getScreenshotStem(screenshotPath: string) {
  return path.basename(screenshotPath, path.extname(screenshotPath));
}

async function listFilesRecursively(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nestedPaths = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursively(fullPath);
      }
      return [fullPath];
    })
  );

  return nestedPaths.flat();
}

async function normalizeScreenshotArtifacts(screenshotPath: string): Promise<void> {
  const root = path.join(process.cwd(), ARTIFACT_DIR);
  const screenshotStem = getScreenshotStem(screenshotPath);

  try {
    await fs.access(root);
  } catch {
    return;
  }

  const allFiles = await listFilesRecursively(root);
  const artifactFiles = allFiles.filter(filePath => {
    const fileName = path.basename(filePath).toLowerCase();
    return (
      fileName.includes(screenshotStem.toLowerCase()) &&
      (fileName.includes('-actual') || fileName.includes('-diff')) &&
      fileName.endsWith('.png')
    );
  });

  const diffFiles = artifactFiles.filter(filePath =>
    path.basename(filePath).toLowerCase().includes('-diff')
  );
  const actualFiles = artifactFiles.filter(filePath =>
    path.basename(filePath).toLowerCase().includes('-actual')
  );

  await Promise.all(diffFiles.map(filePath => fs.rm(filePath, { force: true })));

  if (actualFiles.length <= 1) {
    return;
  }

  const actualFilesWithStats = await Promise.all(
    actualFiles.map(async filePath => {
      const stats = await fs.stat(filePath);
      return { filePath, mtimeMs: stats.mtimeMs };
    })
  );

  actualFilesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const newestActual = actualFilesWithStats[0].filePath;

  const canonicalActual = actualFilesWithStats.find(file =>
    !/[-_(\s]\d+[)\s.-]*\.png$/i.test(path.basename(file.filePath))
  )?.filePath;

  if (!canonicalActual) {
    await Promise.all(actualFilesWithStats.slice(1).map(file => fs.rm(file.filePath, { force: true })));
    return;
  }

  if (newestActual !== canonicalActual) {
    await fs.copyFile(newestActual, canonicalActual);
  }

  await Promise.all(
    actualFilesWithStats
      .map(file => file.filePath)
      .filter(filePath => filePath !== canonicalActual)
      .map(filePath => fs.rm(filePath, { force: true }))
  );
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
  } = props;

  let { locator = page } = props;

  await page.waitForLoadState('networkidle');

  for (let i = 0; i < attempts; i++) {
    try {
      let clip;
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

      await expect(locator).toHaveScreenshot(screenshotPath, {
        maxDiffPixelRatio,
        threshold,
        clip,
        fullPage,
      });
      return true;
    } catch (error) {
      await normalizeScreenshotArtifacts(screenshotPath);

      if (i === attempts - 1) {
        console.debug('Screenshot comparison failed after all attempts');
        throw error; // Throw the original error with details instead of a generic message
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This is a fallback in case the loop exits unexpectedly
  throw new Error('Screenshot comparison failed: loop exited without match or proper error');
};

/**
 * Checks if a screenshot of a specific element matches the expected screenshot.
 * It retries the check for a specified number of attempts with a delay between each attempt.
 * By default, the number of attempts is 10 and the delay is 500 milliseconds which results in a maximum wait time of 5 seconds.
 * Between retries, screenshot artifacts are normalized so a single "actual" is kept
 * and stale "diff" images from prior attempts are removed.
 * Instead of sleeping idle prior to calling this function, simply adjust the attempts and delay parameters to achieve the desired wait time.
 * @param pageOrProps - The page to interact with or an object containing page and other properties
 * @param locator - The element to check for screenshot
 * @param screenshotPath - The path to save the screenshot
 * @param attempts - The number of attempts to check for screenshot
 * @param delay - The delay between attempts
 * @returns  True if the screenshot matches, otherwise throws an error
 */
const checkForScreenshot = async (
  pageOrProps: Page | CheckForScreenshotProps,
  locator?: Locator | Page,
  screenshotPath?: string,
  attempts?: number,
  delay?: number
) => {
  if (typeof pageOrProps === 'object' && 'page' in pageOrProps) {
    return await _checkForScreenshot(pageOrProps as CheckForScreenshotProps);
  } else {
    return await _checkForScreenshot({
      page: pageOrProps as Page,
      locator,
      screenshotPath,
      attempts,
      delay,
    });
  }
};

export { checkForScreenshot };
