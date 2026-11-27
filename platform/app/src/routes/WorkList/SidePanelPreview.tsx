import React, { useEffect } from 'react';

import { useCustomization } from '@ohif/core';
import { StudyList, type StudyRow } from '@ohif/ui-next';
import { useSeriesFetch } from '../../hooks';

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
  studyListData,
  onModalitiesResolved,
}: {
  dataSource: any;
  selected: StudyRow | null;
  /**
   * The study list the selection came from. A new value (a refetch) reloads
   * the selected study's series even when its UID is unchanged.
   */
  studyListData?: unknown;
  /**
   * Called with the modalities derived from the selected study's series when
   * the study row had none, so the study list can use them for the row too.
   */
  onModalitiesResolved?: (studyInstanceUid: string, modalities: string) => void;
}) {
  const { series, seriesStudyInstanceUID, onThumbnailImageError } = useSeriesFetch({
    dataSource,
    selected,
    refreshKey: studyListData,
  });
  const thumbnailRendering = dataSource?.getConfig?.()?.thumbnailRendering;
  const thumbnailRequestStrategy =
    dataSource?.getConfig?.()?.thumbnailRequestStrategy || 'bulkDataRetrieve';
  const forceListView =
    thumbnailRendering === 'wadors' ||
    thumbnailRendering === 'thumbnailDirect' ||
    thumbnailRequestStrategy === 'bulkDataRetrieve';

  // useCustomization subscribes to customization changes, so a runtime change
  // to the series view takes effect without closing and reopening the panel.
  const customizationSeriesView = useCustomization('workList.previewSeriesView');
  const configuredSeriesView: PreviewSeriesView = ALLOWED_PREVIEW_SERIES_VIEWS.includes(
    customizationSeriesView as PreviewSeriesView
  )
    ? (customizationSeriesView as PreviewSeriesView)
    : 'all';
  const seriesView: PreviewSeriesView = forceListView ? 'list' : configuredSeriesView;

  /**
   * When the study query did not return ModalitiesInStudy, derive the
   * modalities from the fetched series so the workflow list can be filtered
   * for this study. Only a series list fetched for the selected study is used,
   * never one left over from the previous selection.
   */
  const selectedUid = selected?.studyInstanceUid;
  const derivedModalities =
    selected && !String(selected.modalities ?? '').trim() && seriesStudyInstanceUID === selectedUid
      ? Array.from(
          new Set(
            series
              .map(s =>
                String(s.modality || s.Modality || '')
                  .trim()
                  .toUpperCase()
              )
              .filter(Boolean)
          )
        ).join('/')
      : '';
  const study = derivedModalities ? { ...selected, modalities: derivedModalities } : selected;

  useEffect(() => {
    if (selectedUid && derivedModalities) {
      onModalitiesResolved?.(selectedUid, derivedModalities);
    }
  }, [selectedUid, derivedModalities, onModalitiesResolved]);

  const previewProps: PreviewContentProps = {
    study: study as StudyRow | null,
    series,
    seriesView,
    onThumbnailImageError,
  };

  const renderPreviewContent = useCustomization('workList.renderPreviewContent');
  if (typeof renderPreviewContent === 'function') {
    return <>{(renderPreviewContent as RenderPreviewContent)(React, previewProps)}</>;
  }
  return <DefaultPreviewContent {...previewProps} />;
}

export type PreviewContentProps = {
  study: StudyRow | null;
  series: any[];
  seriesView: PreviewSeriesView;
  onThumbnailImageError: (seriesUID: string) => void;
};

export type RenderPreviewContent = (
  React: typeof import('react'),
  props: PreviewContentProps
) => React.ReactNode;

function DefaultPreviewContent({
  study,
  series,
  seriesView,
  onThumbnailImageError,
}: PreviewContentProps) {
  return (
    <StudyList.PreviewContainer>
      <StudyList.PreviewHeader>
        <StudyListSettingsPopover />
        <StudyList.ClosePreviewButton />
      </StudyList.PreviewHeader>
      <StudyList.PreviewContent
        study={study}
        series={series}
        seriesView={seriesView}
        onThumbnailImageError={onThumbnailImageError}
      />
    </StudyList.PreviewContainer>
  );
}
