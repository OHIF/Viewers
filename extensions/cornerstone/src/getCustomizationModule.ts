import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';
import { CONSTANTS } from '@cornerstonejs/core';
import { CornerstoneOverlay } from './Viewport/Overlays/CustomizableViewportOverlay';

const DefaultColormap = 'Grayscale';
const { VIEWPORT_PRESETS } = CONSTANTS;

const tools = {
  active: [
    {
      toolName: toolNames.WindowLevel,
      bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
    },
    {
      toolName: toolNames.Pan,
      bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
    },
    {
      toolName: toolNames.Zoom,
      bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
    },
    {
      toolName: toolNames.StackScroll,
      bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
    },
  ],
  enabled: [
    {
      toolName: toolNames.PlanarFreehandContourSegmentation,
      configuration: {
        displayOnePointAsCrosshairs: true,
      },
    },
  ],
};

function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: [
        CornerstoneOverlay,
        {
          id: 'cornerstone.overlayViewportTools',
          tools,
        },
        {
          id: 'cornerstone.windowLevelPresets',
          presets: defaultWindowLevelPresets,
        },
        {
          id: 'cornerstone.colorbar',
          width: '16px',
          colorbarTickPosition: 'left',
          colormaps,
          colorbarContainerPosition: 'right',
          colorbarInitialColormap: DefaultColormap,
        },
        {
          id: 'cornerstone.3dVolumeRendering',
          volumeRenderingPresets: VIEWPORT_PRESETS,
          volumeRenderingQualityRange: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        {
          id: 'cornerstone.measurements',
          Angle: {
            displayText: [],
            report: [],
          },
          CobbAngle: {
            displayText: [],
            report: [],
          },
          ArrowAnnotate: {
            displayText: [],
            report: [],
          },
          RectangleROi: {
            displayText: [],
            report: [],
          },
          CircleROI: {
            displayText: [],
            report: [],
          },
          EllipticalROI: {
            displayText: [],
            report: [],
          },
          Bidirectional: {
            displayText: [],
            report: [],
          },
          Length: {
            displayText: [],
            report: [],
          },
          LivewireContour: {
            displayText: [],
            report: [],
          },
          SplineROI: {
            displayText: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
              /**
              {
                displayName: 'Modality',
                value: 'Modality',
                type: 'value',
              },
              */
            ],
            report: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'areaUnits',
                type: 'value',
              },
            ],
          },
          PlanarFreehandROI: {
            displayTextOpen: [
              {
                displayName: 'Length',
                value: 'length',
                type: 'value',
              },
            ],
            displayText: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'pixelValueUnits',
                for: ['mean', 'max' /** 'stdDev **/],
                type: 'unit',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
              /**
              {
                displayName: 'Std Dev',
                value: 'stdDev',
                type: 'value',
              },
              */
            ],
            report: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'unit',
                type: 'value',
              },
            ],
          },
        },
      ],
    },
  ];
}

export default getCustomizationModule;
