import React, { useEffect, useState, useCallback, ReactElement } from 'react';
import PropTypes from 'prop-types';
import { utilities as cstUtils } from '@cornerstonejs/tools';
import BrushConfiguration from './BrushConfiguration';
import { ServicesManager } from '@ohif/core';

const { segmentation: segmentationUtils } = cstUtils;

const DEFAULT_BRUSH_SIZE = 25;
const brushThresholds = [
  {
    id: 'ct-fat',
    threshold: [-150, -70],
    name: 'CT Fat',
  },
  {
    id: 'ct-bone',
    threshold: [200, 1000],
    name: 'CT Bone',
  },
  {
    id: 'pt',
    threshold: [2.5, 100],
    name: 'PT',
  },
];

const getViewportIdByIndex = (servicesManager, viewportIndex) => {
  const { viewportGridService } = servicesManager.services;
  return viewportGridService.getState().viewports[viewportIndex]?.id;
};

const getToolGroupThresholdSettings = toolGroup => {
  const currentBrushThreshold = segmentationUtils.getBrushThresholdForToolGroup(
    toolGroup.id
  );

  const brushThreshold = brushThresholds.find(
    brushThresholdItem =>
      currentBrushThreshold &&
      brushThresholdItem.threshold[0] === currentBrushThreshold[0] &&
      brushThresholdItem.threshold[1] === currentBrushThreshold[1]
  );

  if (currentBrushThreshold && !brushThreshold) {
    console.warn(
      `No brush threshold setting found for [${currentBrushThreshold[0]}, ${currentBrushThreshold[1]}]`
    );
  }

  return brushThreshold ?? brushThresholds[0];
};

const getViewportBrushToolSettings = (servicesManager, viewportIndex) => {
  const { toolGroupService } = servicesManager.services;
  const viewportId = getViewportIdByIndex(servicesManager, viewportIndex);
  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
  const brushThreshold = getToolGroupThresholdSettings(toolGroup);
  const brushSize =
    (toolGroup && segmentationUtils.getBrushSizeForToolGroup(toolGroup.id)) ??
    DEFAULT_BRUSH_SIZE;

  return { brushThreshold, brushSize };
};

function BrushConfigurationWithServices({
  servicesManager,
}: {
  servicesManager: ServicesManager;
}): ReactElement {
  const { viewportGridService, toolGroupService } = servicesManager.services;

  const [activeViewportIndex, setActiveViewportIndex] = useState(
    () => viewportGridService.getState().activeViewportIndex ?? 0
  );

  const getActiveViewportBrushToolSettings = useCallback(
    () => getViewportBrushToolSettings(servicesManager, activeViewportIndex),
    [servicesManager, activeViewportIndex]
  );

  const [selectedBrushThresholdId, setSelectedBrushThresholdId] = useState(
    getActiveViewportBrushToolSettings().brushThreshold.id
  );

  const [brushSize, setBrushSize] = useState(
    () => getActiveViewportBrushToolSettings().brushSize
  );

  const brushThresholdOptions = brushThresholds.map(
    ({ id, threshold, name }) => ({
      value: id,
      label: `${name} (${threshold.join(', ')})`,
      placeHolder: `${name} (${threshold.join(', ')})`,
    })
  );

  const handleBrushThresholdChange = brushThresholdId => {
    const brushThreshold = brushThresholds.find(
      brushThreshold => brushThreshold.id === brushThresholdId
    );

    const toolGroup = toolGroupService.getToolGroup();

    if (!toolGroup) {
      console.warn('toolGroup not found');
      return;
    }

    segmentationUtils.setBrushThresholdForToolGroup(
      toolGroup.id,
      brushThreshold.threshold
    );

    setSelectedBrushThresholdId(brushThreshold.id);
  };

  const handleBrushSizeChange = brushSize => {
    const toolGroup = toolGroupService.getToolGroup();

    if (!toolGroup) {
      console.warn('toolGroup not found');
      return;
    }

    segmentationUtils.setBrushSizeForToolGroup(toolGroup.id, brushSize);
    setBrushSize(brushSize);
  };

  // Updates the thresholdId for the active viewport
  useEffect(() => {
    const { brushThreshold, brushSize } = getActiveViewportBrushToolSettings();

    setSelectedBrushThresholdId(brushThreshold.id);
    setBrushSize(brushSize);
  }, [activeViewportIndex, getActiveViewportBrushToolSettings]);

  // Updates the active viewport index whenever it changes
  useEffect(() => {
    const { unsubscribe } = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_INDEX_CHANGED,
      ({ viewportIndex, ...rest }) => {
        setActiveViewportIndex(viewportIndex);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportGridService]);

  return (
    <BrushConfiguration
      brushThresholdOptions={brushThresholdOptions}
      brushThresholdId={selectedBrushThresholdId}
      brushSize={brushSize}
      onBrushThresholdChange={handleBrushThresholdChange}
      onBrushSizeChange={handleBrushSizeChange}
    />
  );
}

BrushConfigurationWithServices.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager),
};

export { BrushConfigurationWithServices as default };
