import React from 'react';
import PropTypes from 'prop-types';
//
import PanelStudyBrowserTracking from './PanelStudyBrowserTracking';
import getImageSrcFromImageId from './getImageSrcFromImageId';
import getStudiesForPatientByStudyInstanceUID from './getStudiesForPatientByStudyInstanceUID';
import requestDisplaySetCreationForStudy from './requestDisplaySetCreationForStudy';

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
  const _getStudiesForPatientByStudyInstanceUID = getStudiesForPatientByStudyInstanceUID.bind(
    null,
    dataSource
  );
  const _getImageSrcFromImageId = _createGetImageSrcFromImageIdFn(
    commandsManager.getCommand.bind(commandsManager)
  );
  const _requestDisplaySetCreationForStudy = requestDisplaySetCreationForStudy.bind(
    null,
    dataSource
  );

  return (
    <PanelStudyBrowserTracking
      MeasurementService={servicesManager.services.MeasurementService}
      DisplaySetService={servicesManager.services.DisplaySetService}
      UIDialogService={servicesManager.services.UIDialogService}
      UINotificationService={servicesManager.services.UINotificationService}
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
function _createGetImageSrcFromImageIdFn(getCommand) {
  try {
    const command = getCommand('getCornerstoneLibraries', 'VIEWER');
    if (!command) {
      return;
    }
    const { cornerstone } = command.commandFn();

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
