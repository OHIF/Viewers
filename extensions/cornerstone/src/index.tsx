import React from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  Enums as cs3DEnums,
  imageLoadPoolManager,
  imageRetrievalPoolManager,
} from '@cornerstonejs/core';
import { Enums as cs3DToolsEnums } from '@cornerstonejs/tools';
import { Types } from '@ohif/core';

import init from './init';
import commandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import ToolGroupService from './services/ToolGroupService';
import SyncGroupService from './services/SyncGroupService';
import SegmentationService from './services/SegmentationService';
import CornerstoneCacheService from './services/CornerstoneCacheService';

import { toolNames } from './initCornerstoneTools';
import { getEnabledElement, reset as enabledElementReset } from './state';
import CornerstoneViewportService from './services/ViewportService/CornerstoneViewportService';
import dicomLoaderService from './utils/dicomLoaderService';
import { registerColormap } from './utils/colormap/transferFunctionHelpers';

import { id } from './id';
import * as csWADOImageLoader from './initWADOImageLoader.js';
import { measurementMappingUtils } from './utils/measurementServiceMappings';

const Component = React.lazy(() => {
  return import(
    /* webpackPrefetch: true */ './Viewport/OHIFCornerstoneViewport'
  );
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
const cornerstoneExtension: Types.Extensions.Extension = {
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
   * Register the Cornerstone 3D services and set them up for use.
   *
   * @param configuration.csToolsConfig - Passed directly to `initCornerstoneTools`
   */
  async preRegistration({
    servicesManager,
    commandsManager,
    configuration = {},
    appConfig,
  }) {
    // Todo: we should be consistent with how services get registered. Use REGISTRATION static method for all
    servicesManager.registerService(
      CornerstoneViewportService(servicesManager)
    );
    servicesManager.registerService(
      ToolGroupService.REGISTRATION(servicesManager)
    );
    servicesManager.registerService(SyncGroupService(servicesManager));
    servicesManager.registerService(SegmentationService(servicesManager));
    servicesManager.registerService(
      CornerstoneCacheService.REGISTRATION(servicesManager)
    );

    await init({ servicesManager, commandsManager, configuration, appConfig });
  },
  getHangingProtocolModule,
  getViewportModule({ servicesManager, commandsManager }) {
    const ExtendedOHIFCornerstoneViewport = props => {
      // const onNewImageHandler = jumpData => {
      //   commandsManager.runCommand('jumpToImage', jumpData);
      // };
      const { ToolbarService } = servicesManager.services;

      return (
        <OHIFCornerstoneViewport
          {...props}
          ToolbarService={ToolbarService}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      );
    };

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
export { measurementMappingUtils };
