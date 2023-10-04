function requestDisplaySetCreationForStudy(
  dataSource,
  displaySetService,
  StudyInstanceUID,
  madeInClient
) {
  if (
    displaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    return;
  }

  dataSource.retrieve.series.metadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
