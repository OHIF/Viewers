import React from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  Enums as cs3DEnums,
  imageLoadPoolManager,
  imageRetrievalPoolManager,
} from '@cornerstonejs/core';
import { Enums as cs3DToolsEnums } from '@cornerstonejs/tools';
import init from './init';
import commandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import ToolGroupService from './services/ToolGroupService';
import SyncGroupService from './services/SyncGroupService';
import SegmentationService from './services/SegmentationService';
import CornerstoneCacheService from './services/CornerstoneCacheService';

import { toolNames } from './initCornerstoneTools';
import {
  getEnabledElement,
  setEnabledElement,
  reset as enabledElementReset,
} from './state';
import CornerstoneViewportService from './services/ViewportService/CornerstoneViewportService';

import dicomLoaderService from './utils/dicomLoaderService';
import { registerColormap } from './utils/colormap/transferFunctionHelpers';

import { id } from './id';
import * as csWADOImageLoader from './initWADOImageLoader.js';

const Component = React.lazy(() => {
  return import(
    /* webpackPrefetch: true */ './Viewport/OHIFCornerstoneViewport'
  );
});

const OHIFCornerstoneViewport = React.forwardRef((props, ref) => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component ref={ref} {...props} />
    </React.Suspense>
  );
});
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

/**
 *
 */
const cornerstoneExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  onModeExit: () => {
    // Empty out the image load and retrieval pools to prevent memory leaks
    // on the mode exits
    Object.values(cs3DEnums.RequestType).forEach(type => {
      imageLoadPoolManager.clearRequestStack(type);
      imageRetrievalPoolManager.clearRequestStack(type);
    });

    csWADOImageLoader.destroy();
    enabledElementReset();
  },

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  async preRegistration({
    servicesManager,
    commandsManager,
    configuration = {},
    appConfig,
  }) {
    servicesManager.registerService(
      CornerstoneViewportService(servicesManager)
    );
    servicesManager.registerService(ToolGroupService(servicesManager));
    servicesManager.registerService(SyncGroupService(servicesManager));
    servicesManager.registerService(SegmentationService(servicesManager));
    servicesManager.registerService(CornerstoneCacheService(servicesManager));

    await init({ servicesManager, commandsManager, configuration, appConfig });
  },
  getHangingProtocolModule,
  getViewportModule({ servicesManager, commandsManager }) {
    const ExtendedOHIFCornerstoneViewport = React.forwardRef((props, ref) => {
      // const onNewImageHandler = jumpData => {
      //   commandsManager.runCommand('jumpToImage', jumpData);
      // };
      const { ToolBarService } = servicesManager.services;

      return (
        <OHIFCornerstoneViewport
          ref={ref}
          {...props}
          ToolBarService={ToolBarService}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      );
    });

    return [
      {
        name: 'cornerstone',
        component: ExtendedOHIFCornerstoneViewport,
      },
    ];
  },
  getCommandsModule({ servicesManager, commandsManager, extensionManager }) {
    return commandsModule({
      servicesManager,
      commandsManager,
      extensionManager,
    });
  },
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getCornerstoneLibraries: () => {
            return { cornerstone, cornerstoneTools };
          },
          getEnabledElement,
          setEnabledElement,
          dicomLoaderService,
          registerColormap,
        },
      },
      {
        name: 'core',
        exports: {
          Enums: cs3DEnums,
        },
      },
      {
        name: 'tools',
        exports: {
          toolNames,
          Enums: cs3DToolsEnums,
        },
      },
    ];
  },
};

export default cornerstoneExtension;
