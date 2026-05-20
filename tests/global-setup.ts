import { freeOhifE2ePort } from '../.scripts/ci/free-ohif-e2e-port.mjs';

/**
 * Playwright global setup runs before webServer starts.
 * On self-hosted CI, a previous run may still hold port 3335.
 */
export default async function globalSetup() {
  if (process.env.CI) {
    freeOhifE2ePort();
  }
}
