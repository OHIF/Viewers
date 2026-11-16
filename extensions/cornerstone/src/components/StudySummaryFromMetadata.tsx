import React from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import { StudySummary } from '@ohif/ui-next';

const { formatDate } = utils;

export function StudySummaryFromMetadata(props) {
  const { StudyInstanceUID } = props;
  if (!StudyInstanceUID) {
    return null;
  }
  const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
  if (!studyMeta?.series?.length) {
    return null;
  }

  // A series can be in the store with no instances: its summary arrives before its instances, and
  // a series whose metadata comes back empty never gets any. Read the first series that has one.
  const instanceMeta = studyMeta.series.find(series => series.instances?.length)?.instances[0];
  if (!instanceMeta) {
    return null;
  }
  const { StudyDate, StudyDescription } = instanceMeta;

  return (
    <StudySummary
      date={formatDate(StudyDate)}
      description={StudyDescription}
    />
  );
}
