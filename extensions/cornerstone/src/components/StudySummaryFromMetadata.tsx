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

  const instanceMeta = studyMeta.series[0].instances[0];
  const { StudyDate, StudyDescription } = instanceMeta;

  return (
    <StudySummary
      date={formatDate(StudyDate)}
      description={StudyDescription}
    />
  );
}
