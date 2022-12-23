import React from 'react';
import PropTypes from 'prop-types';
//
import PanelStudyBrowserTracking from './PanelStudyBrowserTracking';
import getImageSrcFromImageId from './getImageSrcFromImageId';
import requestDisplaySetCreationForStudy from './requestDisplaySetCreationForStudy';

function _getStudyForPatientUtility(extensionManager) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-default.utilityModule.common'
  );

  const { getStudiesForPatientByStudyInstanceUID } = utilityModule.exports;
  return getStudiesForPatientByStudyInstanceUID;
}

/**
 * Wraps the PanelStudyBrowser and provides features afforded by managers/services
 *
 * @param {object} params
 * @param {object} commandsManager
 * @param {object} extensionManager
 */
function WrappedPanelStudyBrowserTracking({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const dataSource = extensionManager.getActiveDataSource()[0];

  const getStudiesForPatientByStudyInstanceUID = _getStudyForPatientUtility(
    extensionManager
  );
  const _getStudiesForPatientByStudyInstanceUID = getStudiesForPatientByStudyInstanceUID.bind(
    null,
    dataSource
  );
  const _getImageSrcFromImageId = _createGetImageSrcFromImageIdFn(
    extensionManager
  );
  const _requestDisplaySetCreationForStudy = requestDisplaySetCreationForStudy.bind(
    null,
    dataSource
  );

  return (
    <PanelStudyBrowserTracking
      servicesManager={servicesManager}
      dataSource={dataSource}
      getImageSrc={_getImageSrcFromImageId}
      getStudiesForPatientByStudyInstanceUID={
        _getStudiesForPatientByStudyInstanceUID
      }
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

WrappedPanelStudyBrowserTracking.propTypes = {
  commandsManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default WrappedPanelStudyBrowserTracking;
