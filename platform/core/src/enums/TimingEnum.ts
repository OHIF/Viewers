export enum TimingEnum {
  // The time from when the users selects a study until the study metadata
  // is loaded (and the display sets are ready)
  STUDY_TO_DISPLAY_SETS = 'studyToDisplaySetsLoaded',

  // The time from when the user selects a study until any viewport renders
  STUDY_TO_FIRST_IMAGE = 'studyToFirstImage',

  // The time from when display sets are loaded until any viewport renders
  // an image.
  DISPLAY_SETS_TO_FIRST_IMAGE = 'displaySetsToFirstImage',

  // The time from when display sets are loaded until all viewports have images
  DISPLAY_SETS_TO_ALL_IMAGES = 'displaySetsToAllImages',

  // The time from when the user hits search until the worklist is displayed
  SEARCH_TO_LIST = 'searchToList',

  // The time from when the html script first starts being evaluated (before
  // any other scripts or CSS is loaded), until the time that the first image
  // is viewed for viewer endpoints, or the time that the first search for studies
  // completes.
  SCRIPT_TO_VIEW = 'scriptToView',
}
