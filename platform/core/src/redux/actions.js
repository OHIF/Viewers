/** Action Creators:
 *  https://redux.js.org/basics/actions#action-creators
 */

import {
  CLEAR_VIEWPORT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_SERVERS,
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
} from './constants/ActionTypes.js';

/**
 * VIEWPORT
 */
export const setViewportSpecificData = (viewportIndex, data) => ({
  type: SET_VIEWPORT,
  viewportIndex,
  data,
});

export const setViewportActive = viewportIndex => ({
  type: SET_VIEWPORT_ACTIVE,
  viewportIndex,
});

export const setLayout = layout => ({
  type: SET_VIEWPORT_LAYOUT,
  layout,
});

export const clearViewportSpecificData = viewportIndex => ({
  type: CLEAR_VIEWPORT,
  viewportIndex,
});

export const setActiveViewportSpecificData = data => ({
  type: SET_ACTIVE_SPECIFIC_DATA,
  data,
});

/**
 * NOT-VIEWPORT
 */
export const setStudyLoadingProgress = (progressId, progressData) => ({
  type: 'SET_STUDY_LOADING_PROGRESS',
  progressId,
  progressData,
});

export const clearStudyLoadingProgress = progressId => ({
  type: 'CLEAR_STUDY_LOADING_PROGRESS',
  progressId,
});

export const setUserPreferences = state => ({
  type: 'SET_USER_PREFERENCES',
  state,
});

export const setExtensionData = (extension, data) => ({
  type: 'SET_EXTENSION_DATA',
  extension,
  data,
});

export const setTimepoints = state => ({
  type: 'SET_TIMEPOINTS',
  state,
});

export const setMeasurements = state => ({
  type: 'SET_MEASUREMENTS',
  state,
});

export const setStudyData = (studyInstanceUid, data) => ({
  type: 'SET_STUDY_DATA',
  studyInstanceUid,
  data,
});

export const setServers = servers => ({
  type: SET_SERVERS,
  servers,
});

export const setViewportLayoutAndData = (layout, viewportSpecificData) => ({
  type: SET_VIEWPORT_LAYOUT_AND_DATA,
  layout,
  viewportSpecificData,
});

const actions = {
  // VIEWPORT
  setViewportActive,
  setViewportSpecificData,
  setViewportLayoutAndData,
  setLayout,
  clearViewportSpecificData,
  setActiveViewportSpecificData,
  setStudyLoadingProgress,
  clearStudyLoadingProgress,
  setUserPreferences,
  setExtensionData,
  setTimepoints,
  setMeasurements,
  setStudyData,
  setServers,
};

export default actions;
