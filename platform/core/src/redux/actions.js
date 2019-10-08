/** Action Creators:
 *  https://redux.js.org/basics/actions#action-creators
 */

import {
  CLEAR_VIEWPORT,
  SET_SERVERS,
  UPDATE_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_VIEWPORT_PANES,
} from './constants/ActionTypes.js';

/**
 * VIEWPORT
 */

/**
 *
 * @param {number} viewportIndex
 * @param {object} viewport
 * @param {string} viewport.studyInstanceUid
 * @param {string} viewport.seriesInstanceUid
 * @param {string} viewport.displaySetInstanceUid
 * @param {string} viewport.sopInstanceUid
 * @param {string[]} viewport.sopClassUids
 * @param {Object} viewport.authorizationHeaders
 * @param {string} viewport.wadoRoot
 * @param {string} viewport.wadoUri
 * @param {string} viewport.plugin
 * @param {number} viewport.frameIndex
 */
export const updateViewport = (
  viewportIndex,
  {
    studyInstanceUid,
    seriesInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    sopClassUids,
    authorizationHeaders,
    wadoRoot,
    wadoUri,
    plugin, // ??
    frameIndex, // ??
  }
) => ({
  type: UPDATE_VIEWPORT,
  viewportIndex,
  viewport: {
    // dom (cornerstone-extension)
    // modality: "SR"
    // images: derived?
    // frameRate
    // instanceNumber
    // isMultiFrame: false
    // ​numImageFrames: 398
    // ​​seriesDate: "20140805"
    // ​​seriesDescription: "CT Nk/Ch/Abd I+  2.0  B31f"
    // ​​seriesNumber: 6
    // ​​seriesTime: "124730.750000"
    //uid: "133e4e93-3385-b154-55d2-d45133398e3c"
    //
    studyInstanceUid,
    seriesInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    sopClassUids,
    authorizationHeaders,
    wadoRoot, // "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs"
    wadoUri, // "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado?requestType=WADO&studyUID=1.3.6.1.4.1.25403.345050719074.3824.20170125112931.11"
    plugin,
    frameIndex, // ??
  },
});

export const setViewportActive = viewportIndex => ({
  type: SET_VIEWPORT_ACTIVE,
  viewportIndex,
});

export const setLayout = ({ numRows, numColumns }) => ({
  type: SET_VIEWPORT_LAYOUT,
  numRows,
  numColumns,
});

export const clearViewportSpecificData = viewportIndex => ({
  type: CLEAR_VIEWPORT,
  viewportIndex,
});

export const setLayoutAndViewportPanes = ({
  numRows,
  numColumns,
  viewportPanes,
}) => ({
  type: SET_VIEWPORT_LAYOUT_AND_VIEWPORT_PANES,
  numRows,
  numColumns,
  viewportPanes,
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

const actions = {
  // VIEWPORT
  setViewportActive,
  setLayoutAndViewportPanes,
  updateViewport,
  setLayout,
  clearViewportSpecificData,
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
