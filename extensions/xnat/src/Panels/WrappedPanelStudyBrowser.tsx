import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
//
import PanelStudyBrowser from './StudyBrowser/PanelStudyBrowser';
import getImageSrcFromImageId from './getImageSrcFromImageId';
import getStudiesForPatientByMRN from './getStudiesForPatientByMRN';
import requestDisplaySetCreationForStudy from './requestDisplaySetCreationForStudy';

/**
 * Creates a function that returns a promise for an image src.
 */
function _createGetImageSrcFromImageIdFn(extensionManager) {
  // Safely retrieve utilities module
  try {
    // Try to get the utility module
    const utilities = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.utilityModule.common'
    );

    if (!utilities || !utilities.exports || !utilities.exports.getCornerstoneLibraries) {
      console.error('XNAT PANEL: Could not find cornerstone utility module or getCornerstoneLibraries export');
      throw new Error('Missing cornerstone utilities');
    }

    // Try to get cornerstone libraries
    const { cornerstone } = utilities.exports.getCornerstoneLibraries();
    
    if (!cornerstone) {
      console.error('XNAT PANEL: cornerstone library not found in getCornerstoneLibraries result');
      throw new Error('Missing cornerstone library');
    }
    
    
    // Return the function that will get image src from imageId
    return (imageId, options = {}) => {
      
      return getImageSrcFromImageId(cornerstone, imageId);
    };
  } catch (ex) {
    console.error('XNAT PANEL: Failed to get cornerstone libraries', ex);
    // Return a dummy function that doesn't crash
    return (imageId, options = {}) => {
      console.warn('XNAT PANEL: No cornerstone available to load images');
      return Promise.resolve('');
    };
  }
}

/**
 * Wraps the PanelStudyBrowser and provides features afforded by managers/services
 *
 * @param {object} params
 * @param {object} commandsManager
 * @param {object} extensionManager
 */
function WrappedPanelStudyBrowser({ extensionManager, servicesManager, commandsManager }) {
  
  // TODO: This should be made available a different way; route should have
  // already determined our datasource
  const [dataSource] = extensionManager.getActiveDataSource();
  
  

  const _getStudiesForPatientByMRN = useCallback(
    (...args) => {
      
      return getStudiesForPatientByMRN(dataSource, ...args);
    },
    [dataSource]
  );
  
  const _getImageSrcFromImageId = useCallback(
    (imageId, options) => {

      return _createGetImageSrcFromImageIdFn(extensionManager)(imageId, options);
    },
    [extensionManager]
  );
  
  // Properly bind requestDisplaySetCreationForStudy function
  const _requestDisplaySetCreationForStudy = useCallback(
    (displaySetService, StudyInstanceUID, madeInClient) => {
      
      // Check if we have a StudyInstanceUID - try getting from sessionStorage if not provided
      if (!StudyInstanceUID) {
        const storedUID = sessionStorage.getItem('xnat_studyInstanceUID');
        if (storedUID) {
          StudyInstanceUID = storedUID;
        } else {
          console.warn('XNAT: No StudyInstanceUID provided for display set creation and none found in sessionStorage');
          return;
        }
      }
      
      // Check if displaySetService is present
      if (!displaySetService) {
        return;
      }
      
      // Check if dataSource is present
      if (!dataSource) {
        return;
      }
      
      return requestDisplaySetCreationForStudy(
        dataSource,
        displaySetService,
        StudyInstanceUID,
        madeInClient
      );
    },
    [dataSource]
  );

  return (
    <PanelStudyBrowser
      servicesManager={servicesManager}
      commandsManager={commandsManager}
      dataSource={dataSource}
      getImageSrc={_getImageSrcFromImageId}
      getStudiesForPatientByMRN={_getStudiesForPatientByMRN}
      requestDisplaySetCreationForStudy={_requestDisplaySetCreationForStudy}
    />
  );
}

WrappedPanelStudyBrowser.propTypes = {
  commandsManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default WrappedPanelStudyBrowser;

