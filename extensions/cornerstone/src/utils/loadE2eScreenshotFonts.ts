/**
 * Loads a single web font for annotation tool text boxes so SVG text rasterizes similarly on
 * Linux, macOS, and Windows during Playwright runs (e2e config only). Falls back silently if the
 * stylesheet cannot load (e.g. offline).
 */
export async function loadE2eScreenshotFonts(appConfig: {
  e2eStableScreenshotFonts?: boolean;
}): Promise<void> {
  if (!appConfig.e2eStableScreenshotFonts) {
    return;
  }

  const href =
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap';

  try {
    await new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('e2e screenshot font stylesheet failed to load'));
      document.head.appendChild(link);
    });
    await document.fonts.load('400 15px Roboto');
  } catch (e) {
    console.warn('[OHIF e2e] loadE2eScreenshotFonts:', e);
  }
}
