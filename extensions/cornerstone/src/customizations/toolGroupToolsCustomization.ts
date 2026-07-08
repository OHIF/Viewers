import { toolNames } from '../initCornerstoneTools';
import {
  MIN_SEGMENTATION_DRAWING_RADIUS,
  MAX_SEGMENTATION_DRAWING_RADIUS,
} from './segmentationToolbarCustomization';

/**
 * Reusable tool group "capability blocks", registered as default
 * customizations so modes and `?customization=` JSON modules can add them to
 * a tool group by name via a mode's `toolGroupAdditions` customization, e.g.
 *
 *   "basic.toolGroupAdditions": {
 *     "default": { "$push": ["cornerstone.segmentationToolGroupTools"] }
 *   }
 *
 * Each block is a `{ active/passive/enabled/disabled }` object suitable for
 * `toolGroupService.addToolsToToolGroup`.
 */
function getToolGroupToolsCustomization({ commandsManager }) {
  const brushInstances = [
    {
      toolName: 'CircularBrush',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'FILL_INSIDE_CIRCLE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'CircularEraser',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'ERASE_INSIDE_CIRCLE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'SphereBrush',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'FILL_INSIDE_SPHERE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'SphereEraser',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'ERASE_INSIDE_SPHERE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'ThresholdCircularBrush',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'THRESHOLD_INSIDE_CIRCLE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'ThresholdSphereBrush',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'THRESHOLD_INSIDE_SPHERE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
      },
    },
    {
      toolName: 'ThresholdCircularBrushDynamic',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'THRESHOLD_INSIDE_CIRCLE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
        threshold: {
          isDynamic: true,
          dynamicRadius: 3,
        },
      },
    },
    {
      toolName: 'ThresholdSphereBrushDynamic',
      parentTool: 'Brush',
      configuration: {
        activeStrategy: 'THRESHOLD_INSIDE_SPHERE',
        minRadius: MIN_SEGMENTATION_DRAWING_RADIUS,
        maxRadius: MAX_SEGMENTATION_DRAWING_RADIUS,
        threshold: {
          isDynamic: true,
          dynamicRadius: 3,
        },
      },
    },
  ];

  const splineInstances = [
    {
      toolName: 'CatmullRomSplineROI',
      parentTool: toolNames.SplineContourSegmentation,
      configuration: {
        spline: {
          type: 'CATMULLROM',
          enableTwoPointPreview: true,
        },
      },
    },
    {
      toolName: 'LinearSplineROI',
      parentTool: toolNames.SplineContourSegmentation,
      configuration: {
        spline: {
          type: 'LINEAR',
          enableTwoPointPreview: true,
        },
      },
    },
    {
      toolName: 'BSplineROI',
      parentTool: toolNames.SplineContourSegmentation,
      configuration: {
        spline: {
          type: 'BSPLINE',
          enableTwoPointPreview: true,
        },
      },
    },
  ];

  return {
    /**
     * The segmentation editing tools (labelmap brushes/scissors and contour
     * segmentation tools), matching the buttons in
     * `cornerstone.segmentationToolbarButtons`.
     */
    'cornerstone.segmentationToolGroupTools': {
      passive: [
        ...brushInstances,
        { toolName: toolNames.LabelmapSlicePropagation },
        { toolName: toolNames.MarkerLabelmap },
        { toolName: toolNames.RegionSegmentPlus },
        { toolName: toolNames.LabelMapEditWithContourTool },
        { toolName: toolNames.SegmentSelect },
        { toolName: toolNames.CircleScissors },
        { toolName: toolNames.RectangleScissors },
        { toolName: toolNames.SphereScissors },
        { toolName: toolNames.LivewireContourSegmentation },
        { toolName: toolNames.SculptorTool },
        ...splineInstances,
      ],
    },

    /**
     * The measurement/annotation tools, matching the `MeasurementTools`
     * buttons in `cornerstone.toolbarButtons`. Useful for adding annotations
     * to modes (such as segmentation) whose tool groups omit them.
     */
    'cornerstone.annotationToolGroupTools': {
      passive: [
        { toolName: toolNames.Length },
        {
          toolName: toolNames.ArrowAnnotate,
          configuration: {
            getTextCallback: (callback, eventDetails) => {
              commandsManager.runCommand('arrowTextCallback', {
                callback,
                eventDetails,
              });
            },
            changeTextCallback: (data, eventDetails, callback) => {
              commandsManager.runCommand('arrowTextCallback', {
                callback,
                data,
                eventDetails,
              });
            },
          },
        },
        { toolName: toolNames.Bidirectional },
        { toolName: toolNames.Probe },
        { toolName: toolNames.DragProbe },
        { toolName: toolNames.EllipticalROI },
        { toolName: toolNames.CircleROI },
        { toolName: toolNames.RectangleROI },
        { toolName: toolNames.Angle },
        { toolName: toolNames.CobbAngle },
        { toolName: toolNames.SplineROI },
        { toolName: toolNames.LivewireContour },
      ],
    },
  };
}

export default getToolGroupToolsCustomization;
