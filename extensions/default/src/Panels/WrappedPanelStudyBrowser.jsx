import React from 'react';
import PropTypes from 'prop-types';
//
import PanelStudyBrowser from './PanelStudyBrowser';
import getImageSrcFromImageId from './getImageSrcFromImageId';

/**
 * Wraps the PanelStudyBrowser and provides features afforded by managers/services
 *
 * @param {object} params
 * @param {object} commandsManager
 * @param {object} extensionManager
 */
function WrappedPanelStudyBrowser({ commandsManager, extensionManager, servicesManager }) {
  // Note: this feels odd
  const dataSource = extensionManager.getDataSources('dicomweb')[0];
  const getStudiesByPatientId = patientId =>
    dataSource.query.studies.search(patientId);
  const _getImageSrcFromImageId = _createGetImageSrcFromImageIdFn(
    commandsManager.getCommand.bind(commandsManager),
  );

  return (
    <PanelStudyBrowser
      servicesManager={servicesManager}
      dataSource={dataSource}
      getImageSrc={_getImageSrcFromImageId}
      getStudiesByPatientId={getStudiesByPatientId}
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
    if(!command) { return; }
    const { cornerstone } = command.commandFn();

    return getImageSrcFromImageId.bind(null, cornerstone);
  } catch (ex) {
    throw new Error('Required command not found');
  }
}

WrappedPanelStudyBrowser.propTypes = {
  commandsManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.object.isRequired,
};

export default WrappedPanelStudyBrowser;
