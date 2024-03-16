import React, { useCallback, useEffect, useState } from 'react';
import { vec3 } from 'gl-matrix';
import PropTypes from 'prop-types';
import { metaData, Enums, utilities } from '@cornerstonejs/core';
import { ViewportOverlay } from '@ohif/ui';
import { ServicesManager } from '@ohif/core';

const EPSILON = 1e-4;

function CornerstoneViewportOverlay({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
}) {
  const { cornerstoneViewportService, toolbarService } = servicesManager.services;
  const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
  const [scale, setScale] = useState(1);
  const [activeTools, setActiveTools] = useState([]);

  /**
   * Initial toolbar state
   */
  useEffect(() => {
    setActiveTools(toolbarService.getActiveTools());
  }, []);

  useEffect(() => {
    let isMounted = true;
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        if (!isMounted) {
          return;
        }

        setActiveTools(toolbarService.getActiveTools());
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
  }, [viewportId, viewportData]);

  const getTopLeftContent = useCallback(() => {
    const { windowWidth, windowCenter } = voi;

    if (activeTools.includes('WindowLevel')) {
      if (typeof windowCenter !== 'number' || typeof windowWidth !== 'number') {
        return null;
      }

      return (
        <div className="flex flex-row text-base">
          <span className="mr-1">W:</span>
          <span className="ml-1 mr-2 font-light">{windowWidth.toFixed(0)}</span>
          <span className="mr-1">L:</span>
          <span className="ml-1 font-light">{windowCenter.toFixed(0)}</span>
        </div>
      );
    }

    if (activeTools.includes('Zoom')) {
      return (
        <div className="flex flex-row text-base">
          <span className="mr-1">Zoom:</span>
          <span className="font-light">{scale.toFixed(2)}x</span>
        </div>
      );
    }

    return null;
  }, [voi, scale, activeTools]);

  const getTopRightContent = useCallback(() => {
    const { imageIndex, numberOfSlices } = imageSliceData;
    if (!viewportData) {
      return;
    }

    let instanceNumber;

    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      instanceNumber = _getInstanceNumberFromStack(viewportData, imageIndex);

      if (!instanceNumber) {
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

    return (
      <div className="flex flex-row text-base">
        <span className="mr-1">I:</span>
        <span className="font-light">
          {instanceNumber !== undefined
            ? `${instanceNumber} (${imageIndex + 1}/${numberOfSlices})`
            : `${imageIndex + 1}/${numberOfSlices}`}
        </span>
      </div>
    );
  }, [imageSliceData, viewportData, viewportId]);

  if (!viewportData) {
    return null;
  }

  const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

  if (!ohifViewport) {
    return null;
  }

  const backgroundColor = ohifViewport.getViewportOptions().background;

  // Todo: probably this can be done in a better way in which we identify bright
  // background
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  return (
    <ViewportOverlay
      topLeft={getTopLeftContent()}
      topRight={getTopRightContent()}
      color={isLight && 'text-[#0944B3]'}
    />
  );
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
function _getInstanceNumberFromVolume(
  viewportData,
  imageIndex,
  viewportId,
  cornerstoneViewportService
) {
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

CornerstoneViewportOverlay.propTypes = {
  viewportData: PropTypes.object,
  imageIndex: PropTypes.number,
  viewportId: PropTypes.string,
  servicesManager: PropTypes.instanceOf(ServicesManager),
};

export default CornerstoneViewportOverlay;
