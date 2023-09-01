import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vec3 } from 'gl-matrix';
import PropTypes from 'prop-types';
import { metaData, Enums, utilities } from '@cornerstonejs/core';
import { ViewportOverlay } from '@ohif/ui';
import { formatPN, formatDICOMDate, formatDICOMTime, formatNumberPrecision } from './utils';
import { InstanceMetadata } from 'platform/core/src/types';
import { ServicesManager } from '@ohif/core';
import { ImageSliceData } from '@cornerstonejs/core/dist/esm/types';

import './CustomizableViewportOverlay.css';

const EPSILON = 1e-4;

interface OverlayItemProps {
  element: any;
  viewportData: any;
  imageSliceData: ImageSliceData;
  servicesManager: ServicesManager;
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

/**
 * Customizable Viewport Overlay
 */
function CustomizableViewportOverlay({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
}) {
  const { toolbarService, cornerstoneViewportService, customizationService } =
    servicesManager.services;
  const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
  const [scale, setScale] = useState(1);
  const [activeTools, setActiveTools] = useState([]);
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

  const instance = useMemo(() => {
    if (viewportData != null) {
      return _getViewportInstance(viewportData, imageIndex);
    } else {
      return null;
    }
  }, [viewportData, imageIndex]);

  const instanceNumber = useMemo(() => {
    if (viewportData != null) {
      return _getInstanceNumber(viewportData, viewportId, imageIndex, cornerstoneViewportService);
    }
    return null;
  }, [viewportData, viewportId, imageIndex, cornerstoneViewportService]);

  /**
   * Initial toolbar state
   */
  useEffect(() => {
    setActiveTools(toolbarService.getActiveTools());
  }, []);

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

  /**
   * Updating the active tools when the toolbar changes
   */
  // Todo: this should act on the toolGroups instead of the toolbar state
  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        setActiveTools(toolbarService.getActiveTools());
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolbarService]);

  const _renderOverlayItem = useCallback(
    item => {
      const overlayItemProps: OverlayItemProps = {
        element,
        viewportData,
        imageSliceData,
        viewportId,
        servicesManager,
        customization: item,
        formatters: {
          formatPN: formatPN,
          formatDate: formatDICOMDate,
          formatTime: formatDICOMTime,
          formatNumberPrecision: formatNumberPrecision,
        },
        instance,
        // calculated
        voi,
        scale,
        instanceNumber,
      };

      if (item.customizationType === 'ohif.overlayItem.windowLevel') {
        return <VOIOverlayItem {...overlayItemProps} />;
      } else if (item.customizationType === 'ohif.overlayItem.zoomLevel') {
        return <ZoomOverlayItem {...overlayItemProps} />;
      } else if (item.customizationType === 'ohif.overlayItem.instanceNumber') {
        return <InstanceNumberOverlayItem {...overlayItemProps} />;
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

  const getTopLeftContent = useCallback(() => {
    const items = topLeftCustomization?.items || [
      {
        id: 'WindowLevel',
        customizationType: 'ohif.overlayItem.windowLevel',
      },
    ];
    return (
      <>
        {items.map((item, i) => (
          <div key={`topLeftOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [topLeftCustomization, _renderOverlayItem]);

  const getTopRightContent = useCallback(() => {
    const items = topRightCustomization?.items || [
      {
        id: 'InstanceNmber',
        customizationType: 'ohif.overlayItem.instanceNumber',
      },
    ];
    return (
      <>
        {items.map((item, i) => (
          <div key={`topRightOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [topRightCustomization, _renderOverlayItem]);

  const getBottomLeftContent = useCallback(() => {
    const items = bottomLeftCustomization?.items || [];
    return (
      <>
        {items.map((item, i) => (
          <div key={`bottomLeftOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [bottomLeftCustomization, _renderOverlayItem]);

  const getBottomRightContent = useCallback(() => {
    const items = bottomRightCustomization?.items || [];
    return (
      <>
        {items.map((item, i) => (
          <div key={`bottomRightOverlayItem_${i}`}>{_renderOverlayItem(item)}</div>
        ))}
      </>
    );
  }, [bottomRightCustomization, _renderOverlayItem]);

  return (
    <ViewportOverlay
      topLeft={getTopLeftContent()}
      topRight={getTopRightContent()}
      bottomLeft={getBottomLeftContent()}
      bottomRight={getBottomRightContent()}
    />
  );
}

function _getViewportInstance(viewportData, imageIndex) {
  let imageId = null;
  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    imageId = viewportData.data.imageIds[imageIndex];
  } else if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    const volumes = viewportData.data;
    if (volumes && volumes.length == 1) {
      const volume = volumes[0];
      imageId = volume.imageIds[imageIndex];
    }
  }
  return imageId ? metaData.get('instance', imageId) || {} : {};
}

function _getInstanceNumber(viewportData, viewportId, imageIndex, cornerstoneViewportService) {
  let instanceNumber;

  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    instanceNumber = _getInstanceNumberFromStack(viewportData, imageIndex);

    if (!instanceNumber && instanceNumber !== 0) {
      return null;
    }
  } else if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    instanceNumber = _getInstanceNumberFromVolume(
      viewportData,
      imageIndex,
      viewportId,
      cornerstoneViewportService
    );
  }
  return instanceNumber;
}

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

CustomizableViewportOverlay.propTypes = {
  viewportData: PropTypes.object,
  imageIndex: PropTypes.number,
  viewportId: PropTypes.string,
};

export default CustomizableViewportOverlay;
