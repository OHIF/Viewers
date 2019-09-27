import asyncComponent from './asyncComponent.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
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

  getViewportModule() {
    return OHIFVTKViewport;
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getCommandsModule() {
    return commandsModule;
  },
};

export default vtkExtension;

export { vtkExtension };

// loadLocales();
