import path from 'path';

/**
 * OHIF Downstream workflow (Cornerstone PR validation against OHIF) sets `OHIF_DOWNSTREAM=1`
 * when running e2e. Use {@link screenshotPathForOhifDownstream} so baselines follow `name.png` /
 * `name-linux.png` without listing both in screenShotPaths.
 */
export function isOhifDownstream(): boolean {
  return process.env.OHIF_DOWNSTREAM === '1' || process.env.OHIF_DOWNSTREAM === 'true';
}

/**
 * @param baselineFileName e.g. `threeDPrimaryDisplayedCorrectly.png`
 * @returns That path when not downstream; otherwise the same basename with `-linux` before the extension
 * (e.g. `threeDPrimaryDisplayedCorrectly-linux.png`).
 */
export function screenshotPathForOhifDownstream(baselineFileName: string): string {
  if (!isOhifDownstream()) {
    return baselineFileName;
  }
  const ext = path.extname(baselineFileName);
  const base = baselineFileName.slice(0, -ext.length);
  return `${base}-linux${ext}`;
}
