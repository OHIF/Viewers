import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vec3 } from 'gl-matrix';
import PropTypes from 'prop-types';
import { metaData, Enums, utilities } from '@cornerstonejs/core';
import { ImageSliceData } from '@cornerstonejs/core/dist/esm/types';
import { ViewportOverlay } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';
import { InstanceMetadata } from '@ohif/core/src/types';
import { formatPN, formatDICOMDate, formatDICOMTime, formatNumberPrecision } from './utils';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';

import './CustomizableViewportOverlay.css';

const EPSILON = 1e-4;

type ViewportData = StackViewportData | VolumeViewportData;

interface OverlayItemProps {
  element: HTMLElement;
  viewportData: ViewportData;
  imageSliceData: ImageSliceData;
  servicesManager: ServicesManager;
  viewportId: string;
  instance: InstanceMetadata;
  customization: any;
  formatters: {
    formatPN: (val) => string;
    formatDate: (val) => string;
    formatTime: (val) => string;
    formatNumberPrecision: (val, number) => string;
  };

  // calculated values
  voi: {
    windowWidth: number;
    windowCenter: number;
  };
  instanceNumber?: number;
  scale?: number;
}

const OverlayItemComponents = {
  'ohif.overlayItem.windowLevel': VOIOverlayItem,
  'ohif.overlayItem.zoomLevel': ZoomOverlayItem,
  'ohif.overlayItem.instanceNumber': InstanceNumberOverlayItem,
};

/**
 * Customizable Viewport Overlay
 */
function CustomizableViewportOverlay({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
}: {
  element: HTMLElement;
  viewportData: ViewportData;
  imageSliceData: ImageSliceData;
  viewportId: string;
  servicesManager: ServicesManager;
}) {
  const { cornerstoneViewportService, customizationService, toolGroupService } =
    servicesManager.services;
  const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
  const [scale, setScale] = useState(1);
  const { imageIndex } = imageSliceData;

  const topLeftCustomization = customizationService.getModeCustomization(
    'cornerstoneOverlayTopLeft'
  );
  const topRightCustomization = customizationService.getModeCustomization(
    'cornerstoneOverlayTopRight'
  );
  const bottomLeftCustomization = customizationService.getModeCustomization(
    'cornerstoneOverlayBottomLeft'
  );
  const bottomRightCustomization = customizationService.getModeCustomization(
    'cornerstoneOverlayBottomRight'
  );

  const instance = useMemo(
    () => (viewportData ? getViewportInstance(viewportData, imageIndex) : null),
    [viewportData, imageIndex]
  );

  const instanceNumber = useMemo(
    () =>
      viewportData
        ? getInstanceNumber(viewportData, viewportId, imageIndex, cornerstoneViewportService)
        : null,
    [viewportData, viewportId, imageIndex, cornerstoneViewportService]
  );

  /**
   * Updating the VOI when the viewport changes its voi
   */
  useEffect(() => {
    const updateVOI = eventDetail => {
      const { range } = eventDetail.detail;

      if (!range) {
        return;
      }

      const { lower, upper } = range;
      const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(lower, upper);

      setVOI({ windowCenter, windowWidth });
    };

    element.addEventListener(Enums.Events.VOI_MODIFIED, updateVOI);

    return () => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
    };
  }, [viewportId, viewportData, voi, element]);

  /**
   * Updating the scale when the viewport changes its zoom
   */
  useEffect(() => {
    const updateScale = eventDetail => {
      const { previousCamera, camera } = eventDetail.detail;

      if (
        previousCamera.parallelScale !== camera.parallelScale ||
        previousCamera.scale !== camera.scale
      ) {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return;
        }

        const imageData = viewport.getImageData();

        if (!imageData) {
          return;
        }

        if (camera.scale) {
          setScale(camera.scale);
          return;
        }

        const { spacing } = imageData;
        // convert parallel scale to scale
        const scale = (element.clientHeight * spacing[0] * 0.5) / camera.parallelScale;
        setScale(scale);
      }
    };

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);
    };
  }, [viewportId, viewportData, cornerstoneViewportService, element]);

  const _renderOverlayItem = useCallback(
    item => {
      const overlayItemProps = {
        element,
        viewportData,
        imageSliceData,
        viewportId,
        servicesManager,
        customization: item,
        formatters: {
          formatPN,
          formatDate: formatDICOMDate,
          formatTime: formatDICOMTime,
          formatNumberPrecision,
        },
        instance,
        voi,
        scale,
        instanceNumber,
      };

      if (!item) {
        return null;
      }

      const { customizationType } = item;
      const OverlayItemComponent = OverlayItemComponents[customizationType];

      if (OverlayItemComponent) {
        return <OverlayItemComponent {...overlayItemProps} />;
      } else {
        const renderItem = customizationService.transform(item);

        if (typeof renderItem.content === 'function') {
          return renderItem.content(overlayItemProps);
        }
      }
    },
    [
      element,
      viewportData,
      imageSliceData,
      viewportId,
      servicesManager,
      customizationService,
      instance,
      voi,
      scale,
      instanceNumber,
    ]
  );

  const getContent = useCallback(
    (customization, defaultItems, keyPrefix) => {
      const items = customization?.items ?? defaultItems;

      return (
        <>
          {items.map((item, index) => (
            <div key={`${keyPrefix}_${index}`}>
              {item?.condition
                ? item.condition()
                  ? _renderOverlayItem(item)
                  : null
                : _renderOverlayItem(item)}
            </div>
          ))}
        </>
      );
    },
    [_renderOverlayItem]
  );

  return (
    <ViewportOverlay
      topLeft={
        /**
         * Inline default overlay items for a more standard expansion
         */
        getContent(
          topLeftCustomization,
          [
            {
              id: 'WindowLevel',
              customizationType: 'ohif.overlayItem.windowLevel',
            },
            {
              id: 'ZoomLevel',
              customizationType: 'ohif.overlayItem.zoomLevel',
              condition: () => {
                const activeToolName = toolGroupService.getActiveToolForViewport(viewportId);
                return activeToolName === 'Zoom';
              },
            },
          ],
          'topLeftOverlayItem'
        )
      }
      topRight={getContent(
        topRightCustomization,
        [
          {
            id: 'InstanceNumber',
            customizationType: 'ohif.overlayItem.instanceNumber',
          },
        ],
        'topRightOverlayItem'
      )}
      bottomLeft={getContent(bottomLeftCustomization, [null], 'bottomLeftOverlayItem')}
      bottomRight={getContent(bottomRightCustomization, [null], 'bottomRightOverlayItem')}
    />
  );
}

const getViewportInstance = (viewportData, imageIndex) => {
  const { viewportType, data } = viewportData;
  let imageId = null;

  switch (viewportType) {
    case Enums.ViewportType.STACK:
      imageId = data.imageIds[imageIndex];
      break;
    case Enums.ViewportType.ORTHOGRAPHIC:
      if (data?.length === 1) {
        imageId = data[0].imageIds[imageIndex];
      }
      break;
    default:
      break;
  }

  return imageId ? metaData.get('instance', imageId) || {} : {};
};

const getInstanceNumber = (viewportData, viewportId, imageIndex, cornerstoneViewportService) => {
  let instanceNumber;

  switch (viewportData.viewportType) {
    case Enums.ViewportType.STACK:
      instanceNumber = _getInstanceNumberFromStack(viewportData, imageIndex);
      break;
    case Enums.ViewportType.ORTHOGRAPHIC:
      instanceNumber = _getInstanceNumberFromVolume(
        viewportData,
        viewportId,
        cornerstoneViewportService
      );
      break;
  }

  return instanceNumber ?? null;
};

function _getInstanceNumberFromStack(viewportData, imageIndex) {
  const imageIds = viewportData.data.imageIds;
  const imageId = imageIds[imageIndex];

  if (!imageId) {
    return;
  }

  const generalImageModule = metaData.get('generalImageModule', imageId) || {};
  const { instanceNumber } = generalImageModule;

  const stackSize = imageIds.length;

  if (stackSize <= 1) {
    return;
  }

  return parseInt(instanceNumber);
}

// Since volume viewports can be in any view direction, they can render
// a reconstructed image which don't have imageIds; therefore, no instance and instanceNumber
// Here we check if viewport is in the acquisition direction and if so, we get the instanceNumber
function _getInstanceNumberFromVolume(viewportData, viewportId, cornerstoneViewportService) {
  const volumes = viewportData.volumes;

  // Todo: support fusion of acquisition plane which has instanceNumber
  if (!volumes || volumes.length > 1) {
    return;
  }

  const volume = volumes[0];
  const { direction, imageIds } = volume;

  const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

  if (!cornerstoneViewport) {
    return;
  }

  const camera = cornerstoneViewport.getCamera();
  const { viewPlaneNormal } = camera;
  // checking if camera is looking at the acquisition plane (defined by the direction on the volume)

  const scanAxisNormal = direction.slice(6, 9);

  // check if viewPlaneNormal is parallel to scanAxisNormal
  const cross = vec3.cross(vec3.create(), viewPlaneNormal, scanAxisNormal);
  const isAcquisitionPlane = vec3.length(cross) < EPSILON;

  if (isAcquisitionPlane) {
    const imageId = imageIds[imageIndex];

    if (!imageId) {
      return {};
    }

    const { instanceNumber } = metaData.get('generalImageModule', imageId) || {};
    return parseInt(instanceNumber);
  }
}

/**
 * Window Level / Center Overlay item
 */
function VOIOverlayItem({ voi, customization }: OverlayItemProps) {
  const { windowWidth, windowCenter } = voi;
  if (typeof windowCenter !== 'number' || typeof windowWidth !== 'number') {
    return null;
  }

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: (customization && customization.color) || undefined }}
    >
      <span className="mr-1 shrink-0">W:</span>
      <span className="ml-1 mr-2 shrink-0 font-light">{windowWidth.toFixed(0)}</span>
      <span className="mr-1 shrink-0">L:</span>
      <span className="ml-1 shrink-0 font-light">{windowCenter.toFixed(0)}</span>
    </div>
  );
}

/**
 * Zoom Level Overlay item
 */
function ZoomOverlayItem({ scale, customization }: OverlayItemProps) {
  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: (customization && customization.color) || undefined }}
    >
      <span className="mr-1 shrink-0">Zoom:</span>
      <span className="font-light">{scale.toFixed(2)}x</span>
    </div>
  );
}

/**
 * Instance Number Overlay Item
 */
function InstanceNumberOverlayItem({
  instanceNumber,
  imageSliceData,
  customization,
}: OverlayItemProps) {
  const { imageIndex, numberOfSlices } = imageSliceData;

  return (
    <div
      className="overlay-item flex flex-row"
      style={{ color: (customization && customization.color) || undefined }}
    >
      <span className="mr-1 shrink-0">I:</span>
      <span className="font-light">
        {instanceNumber !== undefined && instanceNumber !== null
          ? `${instanceNumber} (${imageIndex + 1}/${numberOfSlices})`
          : `${imageIndex + 1}/${numberOfSlices}`}
      </span>
    </div>
  );
}

CustomizableViewportOverlay.propTypes = {
  viewportData: PropTypes.object,
  imageIndex: PropTypes.number,
  viewportId: PropTypes.string,
};

export default CustomizableViewportOverlay;
