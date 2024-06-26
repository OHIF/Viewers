import React from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  Enums as cs3DEnums,
  imageLoadPoolManager,
  imageRetrievalPoolManager,
} from '@cornerstonejs/core';
import * as csStreamingImageVolumeLoader from '@cornerstonejs/streaming-image-volume-loader';
import { Enums as cs3DToolsEnums } from '@cornerstonejs/tools';
import { Types } from '@ohif/core';

import init from './init';
import getCustomizationModule from './getCustomizationModule';
import getCommandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getToolbarModule from './getToolbarModule';
import ToolGroupService from './services/ToolGroupService';
import SyncGroupService from './services/SyncGroupService';
import SegmentationService from './services/SegmentationService';
import CornerstoneCacheService from './services/CornerstoneCacheService';
import CornerstoneViewportService from './services/ViewportService/CornerstoneViewportService';
import ColorbarService from './services/ColorbarService';
import * as CornerstoneExtensionTypes from './types';

import { toolNames } from './initCornerstoneTools';
import { getEnabledElement, reset as enabledElementReset, setEnabledElement } from './state';
import dicomLoaderService from './utils/dicomLoaderService';
import getActiveViewportEnabledElement from './utils/getActiveViewportEnabledElement';

import { id } from './id';
import { measurementMappingUtils } from './utils/measurementServiceMappings';
import type { PublicViewportOptions } from './services/ViewportService/Viewport';
import ImageOverlayViewerTool from './tools/ImageOverlayViewerTool';
import { showLabelAnnotationPopup } from './utils/callInputDialog';
import ViewportActionCornersService from './services/ViewportActionCornersService/ViewportActionCornersService';
import { ViewportActionCornersProvider } from './contextProviders/ViewportActionCornersProvider';
import ActiveViewportWindowLevel from './components/ActiveViewportWindowLevel';
import getSOPInstanceAttributes from './utils/measurementServiceMappings/utils/getSOPInstanceAttributes';
import { findNearbyToolData } from './utils/findNearbyToolData';
import { createFrameViewSynchronizer } from './synchronizers/frameViewSynchronizer';

const { helpers: volumeLoaderHelpers } = csStreamingImageVolumeLoader;
const { getDynamicVolumeInfo } = volumeLoaderHelpers ?? {};

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './Viewport/OHIFCornerstoneViewport');
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

  onModeEnter: ({ servicesManager }: withAppTypes): void => {
    const { cornerstoneViewportService, toolbarService, segmentationService } =
      servicesManager.services;
    toolbarService.registerEventForToolbarUpdate(cornerstoneViewportService, [
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
    ]);

    toolbarService.registerEventForToolbarUpdate(segmentationService, [
      segmentationService.EVENTS.SEGMENTATION_ADDED,
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      segmentationService.EVENTS.SEGMENTATION_UPDATED,
    ]);

    toolbarService.registerEventForToolbarUpdate(cornerstone.eventTarget, [
      cornerstoneTools.Enums.Events.TOOL_ACTIVATED,
    ]);
  },

  onModeExit: ({ servicesManager }: withAppTypes): void => {
    const { cineService } = servicesManager.services;
    // Empty out the image load and retrieval pools to prevent memory leaks
    // on the mode exits
    Object.values(cs3DEnums.RequestType).forEach(type => {
      imageLoadPoolManager.clearRequestStack(type);
      imageRetrievalPoolManager.clearRequestStack(type);
    });

    cineService.setIsCineEnabled(false);

    enabledElementReset();
  },

  /**
   * Register the Cornerstone 3D services and set them up for use.
   *
   * @param configuration.csToolsConfig - Passed directly to `initCornerstoneTools`
   */
  preRegistration: function (props: Types.Extensions.ExtensionParams): Promise<void> {
    const { servicesManager, serviceProvidersManager } = props;
    servicesManager.registerService(CornerstoneViewportService.REGISTRATION);
    servicesManager.registerService(ToolGroupService.REGISTRATION);
    servicesManager.registerService(SyncGroupService.REGISTRATION);
    servicesManager.registerService(SegmentationService.REGISTRATION);
    servicesManager.registerService(CornerstoneCacheService.REGISTRATION);
    servicesManager.registerService(ViewportActionCornersService.REGISTRATION);
    servicesManager.registerService(ColorbarService.REGISTRATION);

    serviceProvidersManager.registerProvider(
      ViewportActionCornersService.REGISTRATION.name,
      ViewportActionCornersProvider
    );

    const { syncGroupService } = servicesManager.services;
    syncGroupService.registerCustomSynchronizer('frameview', createFrameViewSynchronizer);
    return init.call(this, props);
  },

  getToolbarModule,
  getPanelModule({ servicesManager }) {
    return [
      {
        name: 'activeViewportWindowLevel',
        component: () => {
          return <ActiveViewportWindowLevel servicesManager={servicesManager} />;
        },
      },
    ];
  },
  getHangingProtocolModule,
  getViewportModule({ servicesManager, commandsManager }) {
    const ExtendedOHIFCornerstoneViewport = props => {
      // const onNewImageHandler = jumpData => {
      //   commandsManager.runCommand('jumpToImage', jumpData);
      // };
      const { toolbarService } = servicesManager.services;

      return (
        <OHIFCornerstoneViewport
          {...props}
          toolbarService={toolbarService}
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
  getCommandsModule,
  getCustomizationModule,
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
          showLabelAnnotationPopup,
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
      {
        name: 'volumeLoader',
        exports: {
          getDynamicVolumeInfo,
        },
      },
    ];
  },
};

export type { PublicViewportOptions };
export {
  measurementMappingUtils,
  CornerstoneExtensionTypes as Types,
  toolNames,
  getActiveViewportEnabledElement,
  setEnabledElement,
  findNearbyToolData,
  getEnabledElement,
  ImageOverlayViewerTool,
  getSOPInstanceAttributes,
};
export default cornerstoneExtension;
