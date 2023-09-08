import React, { useCallback, useEffect, useState } from 'react';
import { AdvancedToolbox, InputDoubleRange, useViewportGrid } from '@ohif/ui';
import { Types } from '@ohif/extension-cornerstone';
import { utilities } from '@cornerstonejs/tools';

const { segmentation: segmentationUtils } = utilities;

function SegmentationToolbox({ servicesManager, extensionManager }) {
  const { toolbarService, segmentationService, toolGroupService } =
    servicesManager.services as Types.CornerstoneServices;

  const [viewportGrid = {}] = useViewportGrid();
  const { viewports, activeViewportId } = viewportGrid;

  const [brushSize, setBrushSize] = useState(null);
  const [thresholdRange, setThresholdRange] = useState([-500, 500]);
  const [activeTool, setActiveTool] = useState(null);
  const [segmentations, setSegmentations] = useState([]);

  const getActiveViewportToolGroupId = useCallback(() => {
    const viewport = viewports.get(activeViewportId);
    const toolGroup = toolGroupService.getToolGroupForViewport(viewport.viewportId);
    return toolGroup.id;
  }, [viewports, activeViewportId]);

  const updateActiveTool = useCallback(() => {
    if (!viewports?.length || activeViewportId === undefined) {
      return;
    }

    const viewport = viewports.get(activeViewportId);

    if (!viewport.viewportId) {
      return;
    }

    const activeTool = toolGroupService.getActiveToolForViewport(viewport.viewportId);
    setActiveTool(activeTool);
  }, [activeViewportId, viewports]);

  useEffect(() => {
    const events = [
      segmentationService.EVENTS.SEGMENTATION_ADDED,
      segmentationService.EVENTS.SEGMENTATION_UPDATED,
    ];

    const unsubscriptions = [];

    events.forEach(event => {
      const { unsubscribe } = segmentationService.subscribe(event, () => {
        // update segmentations so that we enable brushes
        const segmentations = segmentationService.getSegmentations();
        console.debug('🚀 ~ segmentations:', segmentations);
        setSegmentations(segmentations);

        const brushSize = segmentationUtils.getBrushSizeForToolGroup(
          getActiveViewportToolGroupId()
        );
        setBrushSize(brushSize);
      });

      unsubscriptions.push(unsubscribe);
    });

    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        updateActiveTool();
      }
    );

    unsubscriptions.push(unsubscribe);

    return () => {
      unsubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [activeViewportId, viewports]);

  useEffect(() => {
    updateActiveTool();
  }, [activeViewportId, viewports]);

  const setToolActive = useCallback(toolName => {
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

    setActiveTool(toolName);
  }, []);

  const onBrushSizeChange = useCallback(valueAsStringOrNumber => {
    const value = Number(valueAsStringOrNumber);
    toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
      segmentationUtils.setBrushSizeForToolGroup(toolGroupId, value);
    });
    setBrushSize(value);
  }, []);

  const handleRangeChange = useCallback(
    newRange => {
      if (newRange[0] !== thresholdRange[0] || newRange[1] !== thresholdRange[1]) {
        toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
          const toolGroup = toolGroupService.getToolGroup(toolGroupId);
          toolGroup.setToolConfiguration('ThresholdCircularBrush', {
            strategySpecificConfiguration: {
              THRESHOLD_INSIDE_CIRCLE: {
                threshold: newRange,
              },
            },
          });
        });

        setThresholdRange(newRange);
      }
    },
    [activeViewportId, viewports, thresholdRange]
  );

  return (
    <AdvancedToolbox
      title="Segmentation Tools"
      items={[
        {
          name: 'Brush',
          icon: 'icon-tool-brush',
          disabled: segmentations.length === 0,
          active: activeTool === 'CircularBrush' || activeTool === 'SphereBrush',
          onClick: () => setToolActive('CircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              type: 'range',
              min: 0.01,
              max: 100,
              value: brushSize || 15,
              step: 0.5,
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
          disabled: segmentations.length === 0,
          active: activeTool === 'CircularEraser' || activeTool === 'SphereEraser',
          onClick: () => setToolActive('CircularEraser'),
          options: [
            {
              name: 'Radius (mm)',
              type: 'range',
              min: 0.01,
              max: 100,
              value: brushSize || 15,
              step: 0.5,
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
        {
          name: 'Scissor',
          icon: 'icon-tool-scissor',
          disabled: segmentations.length === 0,
          active:
            activeTool === 'CircleScissor' ||
            activeTool === 'RectangleScissor' ||
            activeTool === 'SphereScissor',
          onClick: () => setToolActive('CircleScissor'),
          options: [
            {
              name: 'Mode',
              type: 'radio',
              value: activeTool,
              values: [
                { value: 'CircleScissor', label: 'Circle' },
                { value: 'RectangleScissor', label: 'Rectangle' },
                { value: 'SphereScissor', label: 'Sphere' },
              ],
              onChange: value => setToolActive(value),
            },
          ],
        },
        {
          name: 'Threshold Tool',
          icon: 'icon-tool-threshold',
          disabled: segmentations.length === 0,
          active: activeTool === 'ThresholdCircularBrush' || activeTool === 'ThresholdSphereBrush',
          onClick: () => setToolActive('ThresholdCircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              type: 'range',
              min: 0.01,
              max: 100,
              value: brushSize || 15,
              step: 0.5,
              onChange: onBrushSizeChange,
            },
            {
              name: 'Mode',
              type: 'radio',
              value: activeTool,
              values: [
                { value: 'ThresholdCircularBrush', label: 'Circle' },
                { value: 'ThresholdSphereBrush', label: 'Sphere' },
              ],
              onChange: value => setToolActive(value),
            },
            {
              type: 'custom',
              children: () => {
                return (
                  <div>
                    <div className="bg-secondary-light h-[1px]"></div>
                    <div className="mt-1 text-[13px] text-white">Threshold</div>
                    <InputDoubleRange
                      values={thresholdRange}
                      onChange={handleRangeChange}
                      minValue={-1000}
                      maxValue={1000}
                      step={1}
                      showLabel={true}
                      allowNumberEdit={true}
                      showAdjustmentArrows={false}
                    />
                  </div>
                );
              },
            },
          ],
        },
      ]}
    />
  );
}

export default SegmentationToolbox;
