import React, { useCallback, useEffect, useState, useReducer } from 'react';
import { AdvancedToolbox, InputDoubleRange, useViewportGrid } from '@ohif/ui';
import { Types } from '@ohif/extension-cornerstone';
import { utilities } from '@cornerstonejs/tools';

const { segmentation: segmentationUtils } = utilities;

const ACTIONS = {
  SET_BRUSH_SIZE: 'SET_BRUSH_SIZE',
  SET_TOOL_CONFIG: 'SET_TOOL_CONFIG',
  SET_ACTIVE_TOOL: 'SET_ACTIVE_TOOL',
};

const initialState = {
  Brush: {
    brushSize: 15,
    mode: 'CircularBrush', // Can be 'CircularBrush' or 'SphereBrush'
  },
  Eraser: {
    brushSize: 15,
    mode: 'CircularEraser', // Can be 'CircularEraser' or 'SphereEraser'
  },
  Scissors: {
    brushSize: 15,
    mode: 'CircleScissor', // E.g., 'CircleScissor', 'RectangleScissor', or 'SphereScissor'
  },
  ThresholdBrush: {
    brushSize: 15,
    thresholdRange: [-500, 500],
  },
  activeTool: null,
};

function toolboxReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TOOL_CONFIG:
      const { tool, config } = action.payload;
      return {
        ...state,
        [tool]: {
          ...state[tool],
          ...config,
        },
      };
    case ACTIONS.SET_ACTIVE_TOOL:
      return { ...state, activeTool: action.payload };
    default:
      return state;
  }
}

function SegmentationToolbox({ servicesManager, extensionManager }) {
  const { toolbarService, segmentationService, toolGroupService } =
    servicesManager.services as Types.CornerstoneServices;

  const [viewportGrid] = useViewportGrid();
  const { viewports, activeViewportId } = viewportGrid;

  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [state, dispatch] = useReducer(toolboxReducer, initialState);

  const updateActiveTool = useCallback(() => {
    if (!viewports?.size || activeViewportId === undefined) {
      return;
    }

    const viewport = viewports.get(activeViewportId);

    dispatch({
      type: ACTIONS.SET_ACTIVE_TOOL,
      payload: toolGroupService.getActiveToolForViewport(viewport.viewportId),
    });
  }, [activeViewportId, viewports, toolGroupService, dispatch]);

  /**
   * sets the tools enabled IF there are segmentations
   */
  useEffect(() => {
    const events = [
      segmentationService.EVENTS.SEGMENTATION_ADDED,
      segmentationService.EVENTS.SEGMENTATION_UPDATED,
    ];

    const unsubscriptions = [];

    events.forEach(event => {
      const { unsubscribe } = segmentationService.subscribe(event, () => {
        const segmentations = segmentationService.getSegmentations();

        const activeSegmentation = segmentations?.find(seg => seg.isActive);

        setToolsEnabled(activeSegmentation?.segmentCount > 0);
      });

      unsubscriptions.push(unsubscribe);
    });

    return () => {
      unsubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [activeViewportId, viewports, segmentationService]);

  /**
   * Update the active tool when the toolbar state changes
   */
  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => {
        updateActiveTool();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolbarService, updateActiveTool]);

  const setToolActive = useCallback(
    toolName => {
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

      dispatch({ type: ACTIONS.SET_ACTIVE_TOOL, payload: toolName });
    },
    [toolbarService, dispatch]
  );

  const updateBrushSize = useCallback(
    (toolName, brushSize) => {
      toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
        segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize, toolName);
      });
    },
    [toolGroupService]
  );

  const onBrushSizeChange = useCallback(
    (valueAsStringOrNumber, toolCategory) => {
      const value = Number(valueAsStringOrNumber);

      _getToolNamesFromCategory(toolCategory).forEach(toolName => {
        updateBrushSize(toolName, value);
      });

      dispatch({
        type: ACTIONS.SET_TOOL_CONFIG,
        payload: {
          tool: toolCategory,
          config: { brushSize: value },
        },
      });
    },
    [toolGroupService, dispatch]
  );

  const handleRangeChange = useCallback(
    newRange => {
      if (
        newRange[0] === state.ThresholdBrush.thresholdRange[0] &&
        newRange[1] === state.ThresholdBrush.thresholdRange[1]
      ) {
        return;
      }

      const toolNames = _getToolNamesFromCategory('ThresholdBrush');

      toolNames.forEach(toolName => {
        toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
          const toolGroup = toolGroupService.getToolGroup(toolGroupId);
          toolGroup.setToolConfiguration(toolName, {
            strategySpecificConfiguration: {
              THRESHOLD_INSIDE_CIRCLE: {
                threshold: newRange,
              },
            },
          });
        });
      });

      dispatch({
        type: ACTIONS.SET_TOOL_CONFIG,
        payload: {
          tool: 'ThresholdBrush',
          config: { thresholdRange: newRange },
        },
      });
    },
    [toolGroupService, dispatch, state.ThresholdBrush.thresholdRange]
  );

  return (
    <AdvancedToolbox
      title="Segmentation Tools"
      items={[
        {
          name: 'Brush',
          icon: 'icon-tool-brush',
          disabled: !toolsEnabled,
          active: state.activeTool === 'CircularBrush' || state.activeTool === 'SphereBrush',
          onClick: () => setToolActive('CircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'brush-radius',
              type: 'range',
              min: 0.01,
              max: 100,
              value: state.Brush.brushSize,
              step: 0.5,
              onChange: value => onBrushSizeChange(value, 'Brush'),
            },
            {
              name: 'Mode',
              type: 'radio',
              id: 'brush-mode',
              value: state.Brush.mode,
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
          disabled: !toolsEnabled,
          active: state.activeTool === 'CircularEraser' || state.activeTool === 'SphereEraser',
          onClick: () => setToolActive('CircularEraser'),
          options: [
            {
              name: 'Radius (mm)',
              type: 'range',
              id: 'eraser-radius',
              min: 0.01,
              max: 100,
              value: state.Eraser.brushSize,
              step: 0.5,
              onChange: value => onBrushSizeChange(value, 'Eraser'),
            },
            {
              name: 'Mode',
              type: 'radio',
              id: 'eraser-mode',
              value: state.Eraser.mode,
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
          disabled: !toolsEnabled,
          active:
            state.activeTool === 'CircleScissor' ||
            state.activeTool === 'RectangleScissor' ||
            state.activeTool === 'SphereScissor',
          onClick: () => setToolActive('CircleScissor'),
          options: [
            {
              name: 'Mode',
              type: 'radio',
              value: state.Scissors.mode,
              id: 'scissor-mode',
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
          disabled: !toolsEnabled,
          active:
            state.activeTool === 'ThresholdCircularBrush' ||
            state.activeTool === 'ThresholdSphereBrush',
          onClick: () => setToolActive('ThresholdCircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'threshold-radius',
              type: 'range',
              min: 0.01,
              max: 100,
              value: state.ThresholdBrush.brushSize,
              step: 0.5,
              onChange: value => onBrushSizeChange(value, 'ThresholdBrush'),
            },
            {
              name: 'Mode',
              type: 'radio',
              id: 'threshold-mode',
              value: state.activeTool,
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
                      values={state.ThresholdBrush.thresholdRange}
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

function _getToolNamesFromCategory(category) {
  let toolNames = [];
  switch (category) {
    case 'Brush':
      toolNames = ['CircularBrush', 'SphereBrush'];
      break;
    case 'Eraser':
      toolNames = ['CircularEraser', 'SphereEraser'];
      break;
    case 'ThresholdBrush':
      toolNames = ['ThresholdCircularBrush', 'ThresholdSphereBrush'];
      break;
    default:
      break;
  }

  return toolNames;
}

export default SegmentationToolbox;
