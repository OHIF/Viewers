import React, { useCallback } from 'react';
//
import PanelStudyBrowserTracking from './PanelStudyBrowserTracking';
import getImageSrcFromImageId from './getImageSrcFromImageId';
import { requestDisplaySetCreationForStudy } from '@ohif/extension-default';
import { useSystem } from '@ohif/core';

function _getStudyForPatientUtility(extensionManager) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-default.utilityModule.common'
  );

  const { getStudiesForPatientByMRN } = utilityModule.exports;
  return getStudiesForPatientByMRN;
}

/**
 * Wraps the PanelStudyBrowser and provides features afforded by managers/services
 *
 * @param {object} params
 * @param {object} commandsManager
 * @param {object} extensionManager
 */
function WrappedPanelStudyBrowserTracking() {
  const { extensionManager } = useSystem();
  const dataSource = extensionManager.getActiveDataSource()[0];

  const getStudiesForPatientByMRN = _getStudyForPatientUtility(extensionManager);
  const _getStudiesForPatientByMRN = getStudiesForPatientByMRN.bind(null, dataSource);
  const _getImageSrcFromImageId = useCallback(
    _createGetImageSrcFromImageIdFn(extensionManager),
    []
  );
  const _requestDisplaySetCreationForStudy = requestDisplaySetCreationForStudy.bind(
    null,
    dataSource
  );

  return (
    <PanelStudyBrowserTracking
      dataSource={dataSource}
      getImageSrc={_getImageSrcFromImageId}
      getStudiesForPatientByMRN={_getStudiesForPatientByMRN}
      requestDisplaySetCreationForStudy={_requestDisplaySetCreationForStudy}
    />
  );
}

/**
 * Grabs cornerstone library reference using a dependent command from
 * the @ohif/extension-cornerstone extension. Then creates a helper function
 * that can take an imageId and return an image src.
 *
 * @param {func} getCommand - CommandManager's getCommand method
 * @returns {func} getImageSrcFromImageId - A utility function powered by
 * cornerstone
 */
function _createGetImageSrcFromImageIdFn(extensionManager) {
  const utilities = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );

  try {
    const { cornerstone } = utilities.exports.getCornerstoneLibraries();
    return getImageSrcFromImageId.bind(null, cornerstone);
  } catch (ex) {
    throw new Error('Required command not found');
  }
}

export default WrappedPanelStudyBrowserTracking;
