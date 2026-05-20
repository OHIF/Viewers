import React, { useCallback, useEffect, useState } from 'react';

import { useAppConfig } from '@state';
import { utils } from '@ohif/core';
import { thumbnailNoImageModalities } from '@ohif/core/src/utils/thumbnailNoImageModalities';
import {
  StudyList,
  PreviewThumbnailStatusState,
  type PreviewThumbnailStatus,
  type StudyRow,
} from '@ohif/ui-next';

import { StudyListSettingsPopover } from './StudyListSettingsPopover';

type PreviewSeriesView = 'all' | 'thumbnails' | 'list';
const ALLOWED_PREVIEW_SERIES_VIEWS: ReadonlyArray<PreviewSeriesView> = [
  'all',
  'thumbnails',
  'list',
];

export function SidePanelPreview({
  dataSource,
  selected,
  servicesManager,
}: {
  dataSource: any;
  selected: StudyRow | null;
  servicesManager: AppTypes.ServicesManager;
}) {
  const [series, setSeries] = useState<any[]>([]);
  const [appConfig] = useAppConfig();
  const { sortBySeriesDate } = utils as any;
  const { customizationService } = servicesManager.services;
  const thumbnailRendering = dataSource?.getConfig?.()?.thumbnailRendering;
  const thumbnailRequestStrategy =
    dataSource?.getConfig?.()?.thumbnailRequestStrategy || 'bulkDataRetrieve';
  const forceListView =
    thumbnailRendering === 'wadors' ||
    thumbnailRendering === 'thumbnailDirect' ||
    thumbnailRequestStrategy === 'bulkDataRetrieve';

  const customizationSeriesView = customizationService.getCustomization(
    'workListUINext.previewSeriesView'
  );
  const configuredSeriesView: PreviewSeriesView = ALLOWED_PREVIEW_SERIES_VIEWS.includes(
    customizationSeriesView as PreviewSeriesView
  )
    ? (customizationSeriesView as PreviewSeriesView)
    : 'all';
  const seriesView: PreviewSeriesView = forceListView ? 'list' : configuredSeriesView;

  useEffect(() => {
    // Drives cancellation when the selection changes or the panel unmounts: stops the
    // worker pool from scheduling new fetches and aborts in-flight requests that honor
    // AbortSignal (the `fetch` thumbnail strategy; the bulkDataURI XHR path cannot abort).
    const abortController = new AbortController();
    const { signal } = abortController;

    const run = async () => {
      const studyInstanceUID = (selected as any)?.studyInstanceUid;
      if (!studyInstanceUID) {
        setSeries([]);
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
          const thumbnailStatus: PreviewThumbnailStatus = thumbnailNoImageModalities.includes(
            modality
          )
            ? { status: PreviewThumbnailStatusState.NotApplicable }
            : { status: PreviewThumbnailStatusState.Loading };
          return {
            ...row,
            thumbnailStatus,
          };
        });

        setSeries(normalizedSeriesList);

        const fetchTargets = normalizedSeriesList.filter((row: any) => {
          const seriesUID = row.seriesInstanceUid || row.SeriesInstanceUID;
          if (!seriesUID) {
            return false;
          }
          return row.thumbnailStatus?.status !== PreviewThumbnailStatusState.NotApplicable;
        });

        // Bound parallel thumbnail fetches so studies with many series don't
        // saturate the connection and stall later viewer navigation. Mirrors
        // CS3D's imageLoadPoolManager.maxNumRequests.thumbnail.
        const maxParallelRequests = Math.max(1, appConfig?.maxNumRequests?.thumbnail ?? 5);
        let nextIndex = 0;
        const fetchThumbnail = async (row: (typeof fetchTargets)[number]) => {
          const seriesUID = row.seriesInstanceUid || row.SeriesInstanceUID;
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
          if (signal.aborted) {
            return;
          }
          setSeries(prev =>
            prev.map(seriesItem => {
              const itemUID = seriesItem.seriesInstanceUid || seriesItem.SeriesInstanceUID;
              if (itemUID !== seriesUID) {
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
        const thumbnailWorker = async () => {
          while (!signal.aborted) {
            const idx = nextIndex++;
            if (idx >= fetchTargets.length) {
              return;
            }
            await fetchThumbnail(fetchTargets[idx]);
          }
        };
        await Promise.all(
          Array.from(
            { length: Math.min(maxParallelRequests, fetchTargets.length) },
            thumbnailWorker
          )
        );
      } catch (e) {
        if (!signal.aborted) {
          console.warn('Failed to load preview series/thumbnails for selected study.', e);
          setSeries([]);
        }
      }
    };

    void run();

    return () => {
      abortController.abort();
    };
  }, [dataSource, selected, appConfig?.maxNumRequests?.thumbnail]);

  const handleThumbnailImageError = useCallback((seriesUID: string) => {
    setSeries(prevSeriesList =>
      prevSeriesList.map(seriesItem => {
        const seriesItemUID = seriesItem.seriesInstanceUid || seriesItem.SeriesInstanceUID;
        if (seriesItemUID !== seriesUID) {
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
  }, []);

  return (
    <StudyList.PreviewContainer>
      <StudyList.PreviewHeader>
        <StudyListSettingsPopover />
        <StudyList.ClosePreviewButton />
      </StudyList.PreviewHeader>
      <StudyList.PreviewContent
        study={selected as StudyRow | null}
        series={series}
        seriesView={seriesView}
        onThumbnailImageError={handleThumbnailImageError}
      />
    </StudyList.PreviewContainer>
  );
}
