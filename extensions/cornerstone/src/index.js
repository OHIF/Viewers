import React from 'react';
import init from './init.js';
import commandsModule from './commandsModule.js';
import CornerstoneViewportDownloadForm from './CornerstoneViewportDownloadForm';

const Component = React.lazy(() => {
  return import('./OHIFCornerstoneViewport');
});

const OHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.cornerstone',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },
  getViewportModule({ servicesManager, commandsManager }) {
    const ExtendedOHIFCornerstoneViewport = props => {
      const onNewImageHandler = jumpData => {
        commandsManager.runCommand('jumpToImage', jumpData);
      };
      const { ToolBarService } = servicesManager;

      return (
        <OHIFCornerstoneViewport
          {...props}
          ToolBarService={ToolBarService}
          onNewImage={onNewImageHandler}
        />
      );
    };

    return [
      { name: 'cornerstone', component: ExtendedOHIFCornerstoneViewport },
    ];
  },
  getCommandsModule({ servicesManager, commandsManager }) {
    return commandsModule({ servicesManager, commandsManager });
  },
};

export { CornerstoneViewportDownloadForm };
