function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID,
  madeInClient,
) {
  // TODO: is this already short-circuited by the map of Retrieve promises?
  if (
    DisplaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    return;
  }

  dataSource.retrieveSeriesMetadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
