import { DicomMetadataStore } from '@ohif/core';

function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID,
  madeInClient
) {
  const studyMetadata = DicomMetadataStore.getStudy(StudyInstanceUID);
  if (studyMetadata.isLoaded) return;

  dataSource.retrieveSeriesMetadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
