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
  SET_USER_PREFERENCES,
} from './constants/ActionTypes.js';

/**
 * The definition of a viewport layout.
 *
 * @typedef {Object} ViewportLayout
 * @property {number} numRows -
 * @property {number} numColumns -
 * @property {array} viewports -
 */

/**
 * VIEWPORT
 */
export const setViewportSpecificData = (
  viewportIndex,
  viewportSpecificData
) => ({
  type: SET_VIEWPORT,
  viewportIndex,
  viewportSpecificData,
});

export const setViewportActive = viewportIndex => ({
  type: SET_VIEWPORT_ACTIVE,
  viewportIndex,
});

/**
 * @param {ViewportLayout} layout
 */
export const setLayout = ({ numRows, numColumns, viewports }) => ({
  type: SET_VIEWPORT_LAYOUT,
  numRows,
  numColumns,
  viewports,
});

/**
 * @param {number} layout.numRows
 * @param {number} layout.numColumns
 * @param {array} viewports
 */
export const setViewportLayoutAndData = (
  { numRows, numColumns, viewports },
  viewportSpecificData
) => ({
  type: SET_VIEWPORT_LAYOUT_AND_DATA,
  numRows,
  numColumns,
  viewports,
  viewportSpecificData,
});

export const clearViewportSpecificData = viewportIndex => ({
  type: CLEAR_VIEWPORT,
  viewportIndex,
});

export const setActiveViewportSpecificData = viewportSpecificData => ({
  type: SET_ACTIVE_SPECIFIC_DATA,
  viewportSpecificData,
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
  type: SET_USER_PREFERENCES,
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

export const setStudyData = (StudyInstanceUID, data) => ({
  type: 'SET_STUDY_DATA',
  StudyInstanceUID,
  data,
});

export const setServers = servers => ({
  type: SET_SERVERS,
  servers,
});

// set collection action
export const setCollections = collections => ({
  type: 'SET_COLLECTION_DATA',
  collections,
});

// redesign actions

export const setActiveStep = step => ({
  type: 'SET_ACTIVE_STEP',
  step,
});
export const setActiveTool = tool => ({
  type: 'SET_ACTIVE_TOOL',
  tool,
});

export const setApplicationMode = mode => ({
  type: 'SET_APPLICATION_MODE',
  mode,
});

export const setMask = mask => ({
  type: 'SET_SELECTION_MASK',
  mask,
});

const actions = {
  /**
   * VIEWPORT
   */
  setViewportActive,
  setViewportSpecificData,
  setViewportLayoutAndData,
  setLayout,
  clearViewportSpecificData,
  setActiveViewportSpecificData,
  /**
   * NOT-VIEWPORT
   */
  setStudyLoadingProgress,
  clearStudyLoadingProgress,
  setUserPreferences,
  setExtensionData,
  setTimepoints,
  setMeasurements,
  setStudyData,
  setServers,

  // set collection action
  setCollections,
  setApplicationMode,
  // redesign actions
  setActiveStep,
  setMask,
  setActiveTool,
};

export default actions;
