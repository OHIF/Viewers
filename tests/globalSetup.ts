/**
 * Playwright global setup (wired via `globalSetup` in playwright.config.ts).
 *
 * Before the test suite runs, open the viewer once against a known study to
 * "warm up" the dev server: trigger the first (slow) lazy webpack compilation,
 * prime the browser/codec caches, and fetch the study metadata. Without this,
 * the first real spec frequently times out waiting on a cold server compile.
 * This run only loads the page and waits for a viewport pane to render; it makes
 * no assertions.
 */
import { chromium, type FullConfig } from '@playwright/test';

const warmupStudyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
const warmupTimeout = 180_000;

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use?.baseURL || 'http://localhost:3335');
  const warmupURL = new URL(
    `/viewer/ohif?StudyInstanceUIDs=${warmupStudyInstanceUID}`,
    baseURL
  ).toString();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(warmupTimeout);
    await page.goto(warmupURL, { waitUntil: 'domcontentloaded', timeout: warmupTimeout });
    await page.waitForLoadState('networkidle', { timeout: warmupTimeout }).catch(() => {});
    await page
      .locator('[data-cy="viewport-pane"]')
      .first()
      .waitFor({ state: 'visible', timeout: warmupTimeout });
  } finally {
    await browser.close();
  }
}
