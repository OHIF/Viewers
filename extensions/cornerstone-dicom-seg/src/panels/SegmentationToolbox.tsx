import React, { useCallback, useEffect, useState } from 'react';
import { AdvancedToolbox } from '@ohif/ui';
import { utilities } from '@cornerstonejs/tools';
import type { Types } from '@ohif/extension-cornerstone';

const { segmentation: segmentationUtils } = utilities;

function SegmentationToolbox({ servicesManager }) {
  const {
    toolbarService,
    segmentationService,
    toolGroupService,
    viewportGridService
  } = servicesManager.services as Types.CornerstoneServices
  const [brushSize, setBrushSize] = useState(null);
  const [activeTool, setactiveTool] = useState(null);

  const getActiveViewportToolGroupId = useCallback(() => {
    const { activeViewportIndex, viewports} = viewportGridService.getState();
    const viewport = viewports[activeViewportIndex];
    const { toolGroupId } = viewport.viewportOptions
    return toolGroupId;
  }, [viewportGridService]);


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
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED, () => {
        const { activeViewportIndex, viewports} = viewportGridService.getState();
    const viewport = viewports[activeViewportIndex];
        const activeTool = toolGroupService.getActiveToolForViewport(viewport.viewportId);
        setactiveTool(activeTool);
      }
    )

    return () => {
      unsub1();
    };
  }, []);

  const onSegmentationToolClick = toolName => {
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
  };

  return (
    <AdvancedToolbox
      title="Segmentation Tools"
      items={[
        {
          name: 'Brush',
          icon: 'icon-tool-brush',
          active: activeTool === 'Brush',
          onClick: () => onSegmentationToolClick('Brush'),
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
              value: 'Circle',
              values: [
                { value: 'Circle', label: 'Circle' },
                { value: 'Sphere', label: 'Sphere' },
              ],
              onChange: value => console.log('Brush mode changed', value),
            },
          ],
        },
        {
          name: 'Eraser',
          icon: 'icon-tool-eraser',
          active: activeTool === 'Eraser',
          onClick: () => console.log('eraser clicked'),
          options: [
            {
              name: 'Mode',
              type: 'radio',
              value: 'EraserSphere',
              values: [
                { value: 'EraserCircle', label: 'Circle' },
                { value: 'EraserSphere', label: 'Sphere' },
              ],
              onChange: value => console.log('Brush mode changed', value),
            },
          ],
        },
      ]}
    />
  );
}

export default SegmentationToolbox;
