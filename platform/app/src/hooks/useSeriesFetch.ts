import { useEffect, useRef, useState } from 'react';

import { useAppConfig } from '@state';
import { utils } from '@ohif/core';
import { thumbnailNoImageModalities } from '@ohif/core/src/utils/thumbnailNoImageModalities';
import {
  PreviewThumbnailStatusState,
  type PreviewThumbnailStatus,
  type StudyRow,
} from '@ohif/ui-next';

// A series row carries arbitrary DICOM fields plus the thumbnail status this
// panel tracks. Only the latter is typed; the rest stays open.
type PreviewSeries = Record<string, any> & { thumbnailStatus: PreviewThumbnailStatus };

// Series rows may carry the UID under either casing depending on the data
// source; read it through one place so callers can't forget a variant.
function getSeriesUID(row: Record<string, any>): string | undefined {
  return row.seriesInstanceUid || row.SeriesInstanceUID;
}

/**
 * Runs `worker` over `items` with at most `maxParallel` in flight at once,
 * stopping early if `signal` aborts. A shared cursor hands each worker the
 * next item, so a slow fetch doesn't hold up the rest.
 */
async function runThumbnailPool<T>(
  items: T[],
  maxParallel: number,
  signal: AbortSignal,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const runWorker = async () => {
    while (!signal.aborted) {
      const idx = nextIndex++;
      if (idx >= items.length) {
        return;
      }
      await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(maxParallel, items.length) }, runWorker));
}

type SetSeries = (next: PreviewSeries[] | ((prev: PreviewSeries[]) => PreviewSeries[])) => void;

/**
 * Loads the series list for the selected study and fills in thumbnails, pushing
 * updates through `setSeries` as they arrive.
 *
 * Module scope on purpose: this body's optional chaining and ternaries sit inside
 * a try/catch, a combination the React Compiler cannot yet lower ("value blocks
 * within a try/catch"). Inlined in the hook it bails the whole thing; plain
 * functions are never compiled, so the limitation does not apply here.
 */
async function loadPreviewSeries({
  studyInstanceUID,
  dataSource,
  signal,
  sortBySeriesDate,
  maxParallelRequests,
  setSeries,
  setSeriesStudyInstanceUID,
  ownedBlobUrlsRef,
}: {
  studyInstanceUID: string | undefined;
  dataSource: any;
  signal: AbortSignal;
  sortBySeriesDate: ((rows: any[]) => any[]) | undefined;
  maxParallelRequests: number;
  setSeries: SetSeries;
  setSeriesStudyInstanceUID: (studyInstanceUID: string | undefined) => void;
  ownedBlobUrlsRef: { current: string[] };
}): Promise<void> {
  if (!studyInstanceUID) {
    setSeries([]);
    setSeriesStudyInstanceUID(undefined);
    return;
  }

  try {
    const seriesList = await dataSource.query.series.search(studyInstanceUID);
    if (signal.aborted) {
      return;
    }

    const sortedSeriesList = sortBySeriesDate?.(seriesList) ?? [];
    const normalizedSeriesList = sortedSeriesList.map(row => {
      const modality = String(row.modality || row.Modality || '').toUpperCase();
      const thumbnailStatus: PreviewThumbnailStatus = thumbnailNoImageModalities.includes(modality)
        ? { status: PreviewThumbnailStatusState.NotApplicable }
        : { status: PreviewThumbnailStatusState.Loading };
      return {
        ...row,
        thumbnailStatus,
      };
    });

    setSeries(normalizedSeriesList);
    setSeriesStudyInstanceUID(studyInstanceUID);

    const fetchTargets = normalizedSeriesList.filter((row: PreviewSeries) => {
      if (!getSeriesUID(row)) {
        return false;
      }
      return row.thumbnailStatus?.status !== PreviewThumbnailStatusState.NotApplicable;
    });

    const fetchThumbnail = async (row: (typeof fetchTargets)[number]) => {
      const seriesUID = getSeriesUID(row);
      let src: string | null = null;
      try {
        const getThumbnailSrc = dataSource?.retrieve?.getGetThumbnailSrc?.(
          { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesUID },
          undefined
        );
        src = (await getThumbnailSrc?.({ signal })) ?? null;
      } catch {
        src = null;
      }
      // Track ownership of blob URLs before the abort check so URLs that
      // arrive just after abort are still revoked on cleanup.
      if (src?.startsWith('blob:')) {
        ownedBlobUrlsRef.current.push(src);
      }
      if (signal.aborted) {
        return;
      }
      setSeries(prev =>
        prev.map(seriesItem => {
          if (getSeriesUID(seriesItem) !== seriesUID) {
            return seriesItem;
          }
          return {
            ...seriesItem,
            thumbnailStatus: src
              ? { status: PreviewThumbnailStatusState.Ready, src }
              : { status: PreviewThumbnailStatusState.NotAvailable },
          };
        })
      );
    };

    await runThumbnailPool(fetchTargets, maxParallelRequests, signal, fetchThumbnail);
  } catch (e) {
    if (!signal.aborted) {
      console.warn('Failed to load preview series/thumbnails for selected study.', e);
      setSeries([]);
      setSeriesStudyInstanceUID(undefined);
    }
  }
}

/**
 * Fetches the series for the selected study and, where applicable, their
 * thumbnails, exposing the resulting list and an image-error handler.
 *
 * Owns the blob-URL lifecycle for thumbnails produced by the `fetch` strategy:
 * every created `blob:` URL is tracked and revoked on study change / unmount,
 * and `onThumbnailImageError` revokes a single failed thumbnail's URL.
 */
export function useSeriesFetch({
  dataSource,
  selected,
}: {
  dataSource: any;
  selected: StudyRow | null;
}): {
  series: PreviewSeries[];
  /** The study the current `series` list was fetched for, once it has loaded. */
  seriesStudyInstanceUID: string | undefined;
  onThumbnailImageError: (seriesUID: string) => void;
} {
  const [series, setSeries] = useState<PreviewSeries[]>([]);
  const [seriesStudyInstanceUID, setSeriesStudyInstanceUID] = useState<string | undefined>();
  /**
   * Keyed on the study UID rather than the row object, so a new object for the
   * same study (e.g. with modalities filled in) does not restart the fetch.
   */
  const studyInstanceUID = (selected as any)?.studyInstanceUid as string | undefined;
  // Blob URLs created by this panel (via the `fetch` thumbnail strategy).
  // Tracked so we can URL.revokeObjectURL them on study change / unmount —
  // otherwise every fetched series leaks one blob worth of memory.
  const ownedBlobUrlsRef = useRef<string[]>([]);
  const [appConfig] = useAppConfig();
  const { sortBySeriesDate } = utils as any;

  useEffect(() => {
    // Drives cancellation when the selection changes or the panel unmounts: stops the
    // worker pool from scheduling new fetches and aborts in-flight requests that honor
    // AbortSignal (the `fetch` thumbnail strategy; the bulkDataURI XHR path cannot abort).
    const abortController = new AbortController();
    const { signal } = abortController;

    // Bound parallel thumbnail fetches so studies with many series don't
    // saturate the connection and stall later viewer navigation. Mirrors
    // CS3D's imageLoadPoolManager.maxNumRequests.thumbnail.
    const maxParallelRequests = Math.max(1, appConfig?.maxNumRequests?.thumbnail ?? 5);

    void loadPreviewSeries({
      studyInstanceUID,
      dataSource,
      signal,
      sortBySeriesDate,
      maxParallelRequests,
      setSeries,
      setSeriesStudyInstanceUID,
      ownedBlobUrlsRef,
    });

    return () => {
      abortController.abort();
      // Revoke blob URLs this run created. Safe even though the old series
      // may still be in the DOM briefly: revokeObjectURL only invalidates
      // future loads, the already-rendered <img> keeps its pixels.
      const urls = ownedBlobUrlsRef.current;
      ownedBlobUrlsRef.current = [];
      urls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, [dataSource, studyInstanceUID, sortBySeriesDate, appConfig?.maxNumRequests?.thumbnail]);

  const onThumbnailImageError = (seriesUID: string) => {
    setSeries(prevSeriesList =>
      prevSeriesList.map(seriesItem => {
        if (getSeriesUID(seriesItem) !== seriesUID) {
          return seriesItem;
        }
        const thumbnailStatus = seriesItem.thumbnailStatus as PreviewThumbnailStatus | undefined;
        if (
          thumbnailStatus?.status === PreviewThumbnailStatusState.Ready &&
          thumbnailStatus.src?.startsWith('blob:')
        ) {
          try {
            URL.revokeObjectURL(thumbnailStatus.src);
          } catch {}
        }
        return {
          ...seriesItem,
          thumbnailStatus: { status: PreviewThumbnailStatusState.NotAvailable },
        };
      })
    );
  };

  return { series, seriesStudyInstanceUID, onThumbnailImageError };
}
