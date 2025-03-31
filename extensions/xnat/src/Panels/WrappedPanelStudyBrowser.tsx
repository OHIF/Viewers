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
    
    console.log('XNAT PANEL: Successfully retrieved cornerstone libraries');
    
    // Return the function that will get image src from imageId
    return (imageId, options = {}) => {
      console.log('XNAT PANEL: Getting image src for imageId:', imageId);
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
  console.log('XNAT PANEL: WrappedPanelStudyBrowser rendering');
  
  // TODO: This should be made available a different way; route should have
  // already determined our datasource
  const [dataSource] = extensionManager.getActiveDataSource();
  
  console.log('XNAT PANEL: Active dataSource:', dataSource);
  
  // Log rendering to check if this component is even being used
  console.log('XNAT PANEL: Component structure', {
    extensionManager, 
    servicesManager, 
    commandsManager
  });

  const _getStudiesForPatientByMRN = useCallback(
    (...args) => {
      console.log('XNAT PANEL: Called _getStudiesForPatientByMRN with args:', args);
      return getStudiesForPatientByMRN(dataSource, ...args);
    },
    [dataSource]
  );
  
  const _getImageSrcFromImageId = useCallback(
    (imageId, options) => {
      console.log('XNAT PANEL: Called _getImageSrcFromImageId with args:', { imageId, options });
      return _createGetImageSrcFromImageIdFn(extensionManager)(imageId, options);
    },
    [extensionManager]
  );
  
  // Properly bind requestDisplaySetCreationForStudy function
  const _requestDisplaySetCreationForStudy = useCallback(
    (displaySetService, StudyInstanceUID, madeInClient) => {
      console.log('XNAT: Wrapper _requestDisplaySetCreationForStudy called:', {
        displaySetService: displaySetService ? 'present' : 'missing',
        StudyInstanceUID,
        madeInClient
      });
      
      // Check if we have a StudyInstanceUID - try getting from sessionStorage if not provided
      if (!StudyInstanceUID) {
        const storedUID = sessionStorage.getItem('xnat_studyInstanceUID');
        if (storedUID) {
          console.log(`XNAT: Using StudyInstanceUID from sessionStorage: ${storedUID}`);
          StudyInstanceUID = storedUID;
        } else {
          console.warn('XNAT: No StudyInstanceUID provided for display set creation and none found in sessionStorage');
          return;
        }
      }
      
      // Check if displaySetService is present
      if (!displaySetService) {
        console.error('XNAT: displaySetService is missing in _requestDisplaySetCreationForStudy call');
        return;
      }
      
      // Check if dataSource is present
      if (!dataSource) {
        console.error('XNAT: dataSource is missing in _requestDisplaySetCreationForStudy call');
        return;
      }
      
      console.log('XNAT: All parameters validated, calling requestDisplaySetCreationForStudy');
      
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

