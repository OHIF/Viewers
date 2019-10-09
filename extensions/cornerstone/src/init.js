import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import initCornerstoneTools from './initCornerstoneTools.js';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init(configuration = {}) {
  const { csToolsConfig } = configuration;
  const { StackManager } = OHIF.utils;
  const metadataProvider = new OHIF.cornerstone.MetadataProvider();

  // ~~ Set our MetadataProvider
  cornerstone.metaData.addProvider(
    metadataProvider.provider.bind(metadataProvider)
  );

  StackManager.setMetadataProvider(metadataProvider);

  // ~~
  const defaultCsToolsConfig = csToolsConfig || {
    globalToolSyncEnabled: true,
    showSVGCursors: true,
    autoResizeViewports: false,
  };

  initCornerstoneTools(defaultCsToolsConfig);

  // ~~ Toooools 🙌
  const {
    PanTool,
    ZoomTool,
    WwwcTool,
    MagnifyTool,
    StackScrollTool,
    StackScrollMouseWheelTool,
    // Touch
    PanMultiTouchTool,
    ZoomTouchPinchTool,
    // Annotations
    EraserTool,
    ArrowAnnotateTool,
    BidirectionalTool,
    LengthTool,
    AngleTool,
    FreehandRoiTool,
    EllipticalRoiTool,
    DragProbeTool,
    RectangleRoiTool,
    // Segmentation
    BrushTool,
  } = csTools;
  const tools = [
    PanTool,
    ZoomTool,
    WwwcTool,
    MagnifyTool,
    StackScrollTool,
    StackScrollMouseWheelTool,
    // Touch
    PanMultiTouchTool,
    ZoomTouchPinchTool,
    // Annotations
    EraserTool,
    ArrowAnnotateTool,
    BidirectionalTool,
    LengthTool,
    AngleTool,
    FreehandRoiTool,
    EllipticalRoiTool,
    DragProbeTool,
    RectangleRoiTool,
    // Segmentation
    BrushTool,
  ];

  tools.forEach(tool => csTools.addTool(tool));
  csTools.setToolActive('Pan', { mouseButtonMask: 4 });
  csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActive('ZoomTouchPinch', {});
}
