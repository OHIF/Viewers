function requestDisplaySetCreationForStudy(
  dataSource,
  displaySetService,
  StudyInstanceUID,
  madeInClient
) {
  // Debug the call to help identify issues
  console.log('XNAT: requestDisplaySetCreationForStudy called with:', {
    dataSource: dataSource ? 'present' : 'missing',
    displaySetService: displaySetService ? 'present' : 'missing',
    StudyInstanceUID,
    madeInClient,
  });

  // Try to get StudyInstanceUID from sessionStorage if it's not provided
  if (!StudyInstanceUID) {
    // Use xnat_studyInstanceUID instead of lastSelectedStudyInstanceUID
    const storedUID = sessionStorage.getItem('xnat_studyInstanceUID');
    if (storedUID) {
      console.log(`XNAT: Using StudyInstanceUID from sessionStorage: ${storedUID}`);
      StudyInstanceUID = storedUID;
    } else {
      console.error('XNAT: No StudyInstanceUID provided for display set creation and none found in sessionStorage');
      return;
    }
  }

  // Check if we have the dataSource and displaySetService
  if (!dataSource || !displaySetService) {
    console.error('XNAT: Missing required services for display set creation');
    console.error('   dataSource:', dataSource);
    console.error('   displaySetService:', displaySetService);
    return;
  }

  // Log the activeDisplaySets to see if we already have display sets for this study
  console.log('XNAT: Current display sets:', displaySetService.activeDisplaySets.length);
  
  // Check if display sets already exist for this study
  const existingDisplaySets = displaySetService.activeDisplaySets.filter(
    displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
  );
  
  if (existingDisplaySets.length > 0) {
    console.log(`XNAT: Study ${StudyInstanceUID} already has ${existingDisplaySets.length} display sets. Not fetching again.`);
    return;
  }

  // If we get here, we need to create display sets for this study
  console.log(`XNAT: Creating display sets for study: ${StudyInstanceUID}`);
  return dataSource.retrieve.series.metadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
