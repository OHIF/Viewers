import csTools from 'cornerstone-tools';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  const { segmentationConfig } = configuration;

  // csTools.addTool(tool);

  // csTools.setToolActive('Pan', { mouseButtonMask: 4 });
  // csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  // csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  // csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  // csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  // csTools.setToolActive('ZoomTouchPinch', {});
}
