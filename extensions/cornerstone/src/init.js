import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import initCornerstoneTools from './initCornerstoneTools.js';

/**
 * I have no idea why this exists. It previously lived in the OHIFCornerstoneViewport
 *
 * @export
 * @param {*} configuration
 */
export default function init(configuration) {
  const { StackManager } = OHIF.utils;
  const metadataProvider = new OHIF.cornerstone.MetadataProvider();

  cornerstone.metaData.addProvider(
    metadataProvider.provider.bind(metadataProvider)
  );

  StackManager.setMetadataProvider(metadataProvider);

  //
  initCornerstoneTools({
    globalToolSyncEnabled: true,
    showSVGCursors: true,
    autoResizeViewports: false,
  });

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
    // Segmentation
    BrushTool,
    RectangleRoiTool,
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
    // Segmentation
    BrushTool,
    RectangleRoiTool,
  ];

  tools.forEach(tool => csTools.addTool(tool));
  csTools.setToolActive('Pan', { mouseButtonMask: 4 });
  csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActive('ZoomTouchPinch', {});

  // const availableTools = [
  //   {
  //     name: 'Bidirectional',
  //     props: {
  //       configuration: {
  //         getMeasurementLocationCallback: toolLabellingFlowCallback,
  //       },
  //   },
  //     name: 'Length',
  //     name: 'Angle',
  //     name: 'FreehandRoi',
  //     name: 'EllipticalRoi',
  //     name: 'CircleRoi',
  //     name: 'RectangleRoi',
  //     name: 'ArrowAnnotate',
}
