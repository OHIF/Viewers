import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { metaData, Enums, utilities } from '@cornerstonejs/core';
import { ViewportOverlay } from '@ohif/ui';

import Cornerstone3DViewportService from '../services/ViewportService/Cornerstone3DViewportService';

function CornerstoneOverlay({
  viewportData,
  imageIndex,
  viewportIndex,
  ToolBarService,
}) {
  const [voi, setVOI] = useState({ windowCenter: null, windowWidth: null });
  const [scale, setScale] = useState(1);
  const [activeTools, setActiveTools] = useState([]);

  const getCornerstoneViewport = useCallback(
    viewportIndex => {
      const viewportInfo = Cornerstone3DViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      if (!viewportInfo) {
        return;
      }

      const viewportId = viewportInfo.getViewportId();
      const viewport = Cornerstone3DViewportService.getCornerstone3DViewport(
        viewportId
      );

      return viewport;
    },
    [viewportIndex, viewportData]
  );

  /**
   * Initial toolbar state
   */
  useEffect(() => {
    setActiveTools(ToolBarService.getActiveTools());
  }, []);

  /**
   * Updating the VOI when the viewport changes its voi
   */
  useEffect(() => {
    const viewport = getCornerstoneViewport(viewportIndex);

    if (!viewport) {
      return;
    }

    const { element } = viewport;

    const updateVOI = eventDetail => {
      const { range } = eventDetail.detail;

      if (!range) {
        return;
      }

      const { lower, upper } = range;
      const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(
        lower,
        upper
      );

      setVOI({ windowCenter, windowWidth });
    };

    element.addEventListener(Enums.Events.VOI_MODIFIED, updateVOI);

    return () => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
    };
  }, [viewportIndex, viewportData]);

  /**
   * Updating the scale when the viewport changes its zoom
   */
  useEffect(() => {
    const viewport = getCornerstoneViewport(viewportIndex);
    if (!viewport) {
      return;
    }

    const { element } = viewport;

    const updateScale = eventDetail => {
      const { previousCamera, camera } = eventDetail.detail;

      if (previousCamera.parallelScale !== camera.parallelScale) {
        const viewport = getCornerstoneViewport(viewportIndex);

        if (!viewport) {
          return;
        }

        const imageData = viewport.getImageData();

        if (!imageData) {
          return;
        }

        const { dimensions, spacing } = imageData;

        // Todo: handle for the volume viewports with directions
        const scale = (dimensions[0] * spacing[0]) / camera.parallelScale;
        setScale(scale);
      }
    };

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, updateScale);
    };
  }, [viewportIndex, viewportData]);

  /**
   * Updating the active tools when the toolbar changes
   */
  // Todo: this should act on the toolGroups instead of the toolbar state
  useEffect(() => {
    const { unsubscribe } = ToolBarService.subscribe(
      ToolBarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        setActiveTools(ToolBarService.getActiveTools());
      }
    );

    return () => {
      unsubscribe();
    };
  }, [ToolBarService]);

  const getTopLeftContent = useCallback(() => {
    const { windowWidth, windowCenter } = voi;

    if (activeTools.includes('WindowLevel')) {
      if (typeof windowCenter !== 'number' || typeof windowWidth !== 'number') {
        return null;
      }

      return (
        <div className="flex flex-row">
          <span className="mr-1">W:</span>
          <span className="ml-1 mr-2 font-light">{windowWidth.toFixed(0)}</span>
          <span className="mr-1">L:</span>
          <span className="ml-1 font-light">{windowCenter.toFixed(0)}</span>
        </div>
      );
    }

    if (activeTools.includes('Zoom')) {
      return (
        <div className="flex flex-row">
          <span className="mr-1">Zoom:</span>
          <span className="font-light">{scale.toFixed(2)}x</span>
        </div>
      );
    }

    return null;
  }, [voi, scale, activeTools]);

  const getTopRightContent = useCallback(() => {
    const { stack } = viewportData;
    const imageId = stack.imageIds[imageIndex];

    if (!imageId) {
      return null;
    }

    const generalImageModule =
      metaData.get('generalImageModule', imageId) || {};
    const { instanceNumber } = generalImageModule;

    const stackSize = stack.imageIds ? stack.imageIds.length : 0;

    if (stackSize <= 1) {
      return null;
    }

    return (
      <div className="flex flex-row">
        <span className="mr-1">I:</span>
        <span className="font-light">
          {instanceNumber !== undefined
            ? `${instanceNumber} (${imageIndex + 1}/${stackSize})`
            : `${imageIndex + 1}/${stackSize}`}
        </span>
      </div>
    );
  }, [imageIndex, viewportData]);

  if (!viewportData) {
    return null;
  }

  // Todo: fix this for volume later
  const { stack } = viewportData;

  if (!stack || stack.imageIds.length === 0) {
    throw new Error(
      'ViewportOverlay: only viewports with imageIds is supported at this time'
    );
  }

  return (
    <ViewportOverlay
      topLeft={getTopLeftContent()}
      topRight={getTopRightContent()}
    />
  );
}

CornerstoneOverlay.propTypes = {
  viewportData: PropTypes.object,
  imageIndex: PropTypes.number,
  viewportIndex: PropTypes.number,
};

export default CornerstoneOverlay;
