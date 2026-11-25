import { Page } from '@playwright/test';

export type ViewportCanvasStats = {
  width: number;
  height: number;
  /** Fraction of sampled pixels whose luminance is above the black cutoff (0-1). */
  nonBlackRatio: number;
  /** Order-sensitive digest of the sampled pixels; differs when the rendered frame differs. */
  digest: number;
};

type GetViewportCanvasStatsParams = {
  page: Page;
  /** Cornerstone viewport id; the single-viewport default layout uses 'default'. */
  viewportId?: string;
};

/**
 * Reads the pixels currently painted on a viewport's on-screen canvas and
 * returns aggregate stats. This asserts real rendered output (unlike a
 * services-state read) without a screenshot baseline: `nonBlackRatio` catches
 * blank/black viewports and `digest` catches a viewport stuck on a previous
 * frame after navigation.
 */
export const getViewportCanvasStats = async ({
  page,
  viewportId = 'default',
}: GetViewportCanvasStatsParams): Promise<ViewportCanvasStats> => {
  return page.evaluate(
    ({ services, viewportId }: withTestTypes<{ viewportId: string }>) => {
      const { cornerstoneViewportService } = services;
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId) as any;
      if (!viewport) {
        throw new Error(`getViewportCanvasStats: no cornerstone viewport with id "${viewportId}"`);
      }

      const sourceCanvas = viewport.getCanvas() as HTMLCanvasElement;
      const { width, height } = sourceCanvas;
      if (!width || !height) {
        throw new Error('getViewportCanvasStats: viewport canvas has zero size');
      }

      // Copy onto a plain 2d canvas so pixels are readable regardless of the
      // source canvas context type.
      const copy = document.createElement('canvas');
      copy.width = width;
      copy.height = height;
      const ctx = copy.getContext('2d');
      ctx.drawImage(sourceCanvas, 0, 0);
      const { data } = ctx.getImageData(0, 0, width, height);

      const blackCutoff = 16; // 0-255 luminance below this counts as black
      const sampleStride = 4; // sample every 4th pixel to keep this fast
      let sampled = 0;
      let nonBlack = 0;
      let digest = 0;

      for (let i = 0; i < data.length; i += 4 * sampleStride) {
        const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        sampled += 1;
        if (luminance > blackCutoff) {
          nonBlack += 1;
        }
        // FNV-style rolling hash over the sampled luminance values
        digest = (Math.imul(digest ^ Math.round(luminance), 16777619) >>> 0) as number;
      }

      return {
        width,
        height,
        nonBlackRatio: sampled ? nonBlack / sampled : 0,
        digest,
      };
    },
    { viewportId, services: await page.evaluateHandle('window.services') }
  );
};
