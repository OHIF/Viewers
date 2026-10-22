import type { Page } from '@playwright/test';

type SegmentStat = {
  name: string;
  label: string;
  value: unknown;
  unit?: string;
  order?: number;
};

type Options = {
  page: Page;
  segmentIndex: number;
  /** Needed when more than one segmentation is loaded. */
  segmentationId?: string;
  attempts?: number;
  intervalMs?: number;
};

/**
 * Reads the statistics Cornerstone computed for a segment from the segmentation state. They are
 * computed in the background after the segment is drawn, so this waits until they are in.
 * Returns the stats that have a value, in the order the segment's stats card lists them.
 */
const getSegmentStats = async ({
  page,
  segmentIndex,
  segmentationId,
  attempts = 20,
  intervalMs = 500,
}: Options): Promise<SegmentStat[]> => {
  for (let i = 0; i < attempts; i++) {
    const { segmentationCount, namedStats } = await page.evaluate(
      ({ segmentIndex, segmentationId }) => {
        const cornerstoneTools = (window as any).cornerstoneTools;
        const segmentations = (
          cornerstoneTools?.segmentation?.state?.getSegmentations?.() ?? []
        ).filter(segmentation => !segmentationId || segmentation.segmentationId === segmentationId);

        return {
          segmentationCount: segmentations.length,
          namedStats: segmentations[0]?.segments?.[segmentIndex]?.cachedStats?.namedStats ?? {},
        };
      },
      { segmentIndex, segmentationId }
    );

    if (segmentationCount > 1) {
      throw new Error(
        `Found ${segmentationCount} segmentations; pass the segmentationId of the one to read`
      );
    }

    const stats: SegmentStat[] = Object.values(namedStats as Record<string, SegmentStat>)
      .filter(stat => stat && stat.value !== null)
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

    if (stats.length > 0) {
      return stats;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`No computed stats found for segment ${segmentIndex}`);
};

export { getSegmentStats };
export type { SegmentStat };
