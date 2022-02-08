function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID,
  madeInClient
) {
  if (
    DisplaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    return;
  }

  dataSource.retrieve.series.metadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
