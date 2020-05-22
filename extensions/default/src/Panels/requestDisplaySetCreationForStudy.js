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
}

export default requestDisplaySetCreationForStudy;
