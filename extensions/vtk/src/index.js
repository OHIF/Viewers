import React from 'react';
import { ErrorBoundary } from '@ohif/ui';

import asyncComponent from './asyncComponent.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
import withCommandsManager from './withCommandsManager.js';
// This feels weird
// import loadLocales from './loadLocales';

const OHIFVTKViewport = asyncComponent(() =>
  import(/* webpackChunkName: "OHIFVTKViewport" */ './OHIFVTKViewport.js')
);

const vtkExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'vtk',

  getViewportModule({ commandsManager }) {
    const ExtendedVTKViewport = props => (
      <ErrorBoundary context='OHIFVTKViewport'>
        <OHIFVTKViewport {...props} />
      </ErrorBoundary>
    );
    return withCommandsManager(ExtendedVTKViewport, commandsManager);
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getCommandsModule({ commandsManager }) {
    return commandsModule({ commandsManager });
  },
};

export default vtkExtension;

export { vtkExtension };

// loadLocales();
