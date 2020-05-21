function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID
) {
  // TODO: is this already short-circuited by the map of Retrieve promises?
  if (DisplaySetService.hasDisplaySetsForStudy(StudyInstanceUID)) {
    return;
  }

  dataSource.retrieveSeriesMetadata({ StudyInstanceUID });

  // 1. Update DICOMStore
  // 2. DICOMStore shoots out events
  // 3. IFF instance is in study/series that is "active" (being viewed?), displaySet is created?
  // 4. IFF not, just store is updated
  // 5. IFF active studies change, splitting logic is refired?

  // DisplaySetService.makeDisplaySets
}

export default requestDisplaySetCreationForStudy;
