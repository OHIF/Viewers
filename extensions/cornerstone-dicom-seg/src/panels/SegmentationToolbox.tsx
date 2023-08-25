import React, { useCallback, useEffect, useState } from 'react';
import { AdvancedToolbox, useViewportGrid } from '@ohif/ui';
import { utilities } from '@cornerstonejs/tools';
import { Types } from '@ohif/extension-cornerstone';

const { segmentation: segmentationUtils } = utilities;

function SegmentationToolbox({ servicesManager }) {
  const {
    toolbarService,
    segmentationService,
    toolGroupService,
  } = servicesManager.services as Types.CornerstoneServices;

  const [viewportGrid = {}] = useViewportGrid();
  const { viewports, activeViewportIndex } = viewportGrid;

  const [brushSize, setBrushSize] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  const getActiveViewportToolGroupId = useCallback(() => {
    const viewport = viewports[activeViewportIndex];
    const toolGroup = toolGroupService.getToolGroupForViewport(
      viewport.viewportId
    );
    return toolGroup.id;
  }, [viewports, activeViewportIndex]);

  const updateActiveTool = useCallback(() => {
    if (!viewports?.length || activeViewportIndex === undefined) {
      return;
    }

    const viewport = viewports[activeViewportIndex];

    if (!viewport.viewportId) {
      return;
    }

    const activeTool = toolGroupService.getActiveToolForViewport(
      viewport.viewportId
    );
    console.debug('🚀 ~ activeTool:', activeTool);
    setActiveTool(activeTool);
  }, [activeViewportIndex, viewports]);

  useEffect(() => {
    const { unsubscribe: unsub1 } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_ADDED,
      () => {
        const brushSize = segmentationUtils.getBrushSizeForToolGroup(
          getActiveViewportToolGroupId()
        );
        setBrushSize(brushSize);
      }
    );

    const { unsubscribe: unsub2 } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        updateActiveTool();
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [activeViewportIndex, viewports]);

  useEffect(() => {
    updateActiveTool();
  }, [activeViewportIndex, viewports]);

  const setToolActive = toolName => {
    console.debug('🚀 ~ toolName:', toolName);
    toolbarService.recordInteraction({
      groupId: 'SegmentationTools',
      itemId: 'Brush',
      interactionType: 'tool',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName,
          },
        },
      ],
    });
  };

  const onBrushSizeChange = valueAsStringOrNumber => {
    const value = Number(valueAsStringOrNumber);
    toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
      segmentationUtils.setBrushSizeForToolGroup(toolGroupId, value);
    });
    setBrushSize(value);
  };

  return (
    <AdvancedToolbox
      title="Segmentation Tools"
      items={[
        {
          name: 'Brush',
          icon: 'icon-tool-brush',
          active:
            activeTool === 'CircularBrush' || activeTool === 'SphereBrush',
          onClick: () => setToolActive('CircularBrush'),
          options: [
            {
              name: 'Brush Size',
              type: 'range',
              min: 15,
              max: 40,
              value: brushSize,
              step: 1,
              onChange: onBrushSizeChange,
            },
            {
              name: 'Mode',
              type: 'radio',
              value: activeTool,
              values: [
                { value: 'CircularBrush', label: 'Circle' },
                { value: 'SphereBrush', label: 'Sphere' },
              ],
              onChange: value => setToolActive(value),
            },
          ],
        },
        {
          name: 'Eraser',
          icon: 'icon-tool-eraser',
          active:
            activeTool === 'CircularEraser' || activeTool === 'SphereEraser',
          onClick: () => setToolActive('CircularEraser'),
          options: [
            {
              name: 'Brush Size',
              type: 'range',
              min: 15,
              max: 40,
              value: brushSize,
              step: 1,
              onChange: onBrushSizeChange,
            },
            {
              name: 'Mode',
              type: 'radio',
              value: activeTool,
              values: [
                { value: 'CircularEraser', label: 'Circle' },
                { value: 'SphereEraser', label: 'Sphere' },
              ],
              onChange: value => setToolActive(value),
            },
          ],
        },
      ]}
    />
  );
}

export default SegmentationToolbox;
