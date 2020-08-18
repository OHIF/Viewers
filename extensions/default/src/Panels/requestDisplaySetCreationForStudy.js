function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID
) {
  // TODO: is this already short-circuited by the map of Retrieve promises?
  if (
    DisplaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    return;
  }

  dataSource.retrieveSeriesMetadata({ StudyInstanceUID });
}

export default requestDisplaySetCreationForStudy;
