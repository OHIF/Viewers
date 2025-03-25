function requestDisplaySetCreationForStudy(
  dataSource,
  displaySetService,
  StudyInstanceUID,
  madeInClient
) {
  // Try to get StudyInstanceUID from sessionStorage if it's not provided
  if (!StudyInstanceUID) {
    const storedUID = sessionStorage.getItem('lastSelectedStudyInstanceUID');
    if (storedUID) {
      console.log(`XNAT: Using StudyInstanceUID from sessionStorage: ${storedUID}`);
      StudyInstanceUID = storedUID;
    } else {
      console.error('XNAT: No StudyInstanceUID provided for display set creation and none found in sessionStorage');
      return;
    }
  }

  // TODO: is this already short-circuited by the map of Retrieve promises?
  if (
    displaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    return;
  }

  return dataSource.retrieve.series.metadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
