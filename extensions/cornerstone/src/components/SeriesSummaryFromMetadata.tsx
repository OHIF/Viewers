import React from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import { StudySummary } from '@ohif/ui-next';

const { formatDate } = utils;

export function StudySummaryFromMetadata({ StudyInstanceUID, SeriesInstanceUID }) {
  if (!StudyInstanceUID || !SeriesInstanceUID) {
    return null;
  }
  const seriesMeta = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);
  if (!seriesMeta) {
    return null;
  }

  const { SeriesDate, SeriesDescription } = seriesMeta;

  return (
    <StudySummary
      date={formatDate(SeriesDate)}
      description={SeriesDescription}
    />
  );
}
