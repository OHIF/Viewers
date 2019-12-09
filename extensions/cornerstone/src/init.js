import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import initCornerstoneTools from './initCornerstoneTools.js';
import queryString from 'query-string';
import { SimpleDialog } from '@ohif/ui';
import merge from 'lodash.merge';

function fallbackMetaDataProvider(type, imageId) {
  if (!imageId.includes('wado?requestType=WADO')) {
    return;
  }

  // If you call for an WADO-URI imageId and get no
  // metadata, try reformatting to WADO-RS imageId
  const qs = queryString.parse(imageId);
  const wadoRoot = window.store.getState().servers.servers[0].wadoRoot;
  const wadoRsImageId = `wadors:${wadoRoot}/studies/${qs.studyUID}/series/${
    qs.seriesUID
  }/instances/${qs.objectUID}/frames/${qs.frame || 1}`;

  return cornerstone.metaData.get(type, wadoRsImageId);
}

// Add this fallback provider with a low priority so it is handled last
cornerstone.metaData.addProvider(fallbackMetaDataProvider, -1);

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration }) {
  const callInputDialog = (data, event, callback) => {
    const { UIDialogService } = servicesManager.services;

    if (UIDialogService) {
      let dialogId = UIDialogService.create({
        centralize: true,
        isDraggable: false,
        content: SimpleDialog.InputDialog,
        useLastPosition: false,
        showOverlay: true,
        contentProps: {
          title: 'Enter your annotation',
          label: 'New label',
          measurementData: data ? { description: data.text } : {},
          onClose: () => UIDialogService.dismiss({ id: dialogId }),
          onSubmit: value => {
            callback(value);
            UIDialogService.dismiss({ id: dialogId });
          },
        },
      });
    }
  };

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
  const tools = [
    csTools.PanTool,
    csTools.ZoomTool,
    csTools.WwwcTool,
    csTools.MagnifyTool,
    csTools.StackScrollTool,
    csTools.StackScrollMouseWheelTool,
    // Touch
    csTools.PanMultiTouchTool,
    csTools.ZoomTouchPinchTool,
    // Annotations
    csTools.ArrowAnnotateTool,
    csTools.EraserTool,
    csTools.BidirectionalTool,
    csTools.LengthTool,
    csTools.AngleTool,
    csTools.FreehandRoiTool,
    csTools.EllipticalRoiTool,
    csTools.DragProbeTool,
    csTools.RectangleRoiTool,
    // Segmentation
    csTools.BrushTool,
  ];

  /* Add extension tools configuration here. */
  const extensionToolsConfiguration = {
    ArrowAnnotate: {
      configuration: {
        getTextCallback: (callback, eventDetails) =>
          callInputDialog(null, eventDetails, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(data, eventDetails, callback),
      },
    },
  };

  const isEmpty = obj => Object.keys(obj).length < 1;
  if (!isEmpty(configuration.tools) || !isEmpty(extensionToolsConfiguration)) {
    /* Add tools with its custom props through extension configuration. */
    tools.forEach(tool => {
      const toolName = tool.name.replace('Tool', '');
      const configurationToolProps = configuration.tools[toolName] || {};
      const extensionToolProps = extensionToolsConfiguration[toolName];
      let props = merge(extensionToolProps, configurationToolProps);
      csTools.addTool(tool, props);
    });
  } else {
    tools.forEach(tool => csTools.addTool(tool));
  }

  csTools.setToolActive('Pan', { mouseButtonMask: 4 });
  csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActive('ZoomTouchPinch', {});
}
