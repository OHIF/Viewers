import React from 'react';

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
}: {
  dataSource: any;
  selected: StudyRow | null;
}) {
  const { series, onThumbnailImageError } = useSeriesFetch({ dataSource, selected });
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
   * for this study.
   */
  const derivedModalities =
    selected && !String(selected.modalities ?? '').trim()
      ? Array.from(
          new Set(
            series.map(s => String(s.modality || s.Modality || '').toUpperCase()).filter(Boolean)
          )
        ).join('/')
      : '';
  const study = derivedModalities ? { ...selected, modalities: derivedModalities } : selected;

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
