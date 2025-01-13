import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';
import { CONSTANTS } from '@cornerstonejs/core';
import DicomUpload from './components/DicomUpload/DicomUpload';
import { CinePlayer } from '@ohif/ui';

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
      value: {
        cinePlayer: CinePlayer,
        cornerstoneViewportClickCommands: {
          doubleClick: ['toggleOneUp'],
          button1: ['closeContextMenu'],
          button3: [
            {
              commandName: 'showCornerstoneContextMenu',
              commandOptions: {
                requireNearbyToolData: true,
                menuId: 'measurementsContextMenu',
              },
            },
          ],
        },
        dicomUploadComponent: DicomUpload,
        'viewportOverlay.topLeft': [
          {
            id: 'StudyDate',
            inheritsFrom: 'ohif.overlayItem',
            label: '',
            title: 'Study date',
            condition: ({ referenceInstance }) => referenceInstance?.StudyDate,
            contentF: ({ referenceInstance, formatters: { formatDate } }) =>
              formatDate(referenceInstance.StudyDate),
          },
          {
            id: 'SeriesDescription',
            inheritsFrom: 'ohif.overlayItem',
            label: '',
            title: 'Series description',
            condition: ({ referenceInstance }) => {
              return referenceInstance && referenceInstance.SeriesDescription;
            },
            contentF: ({ referenceInstance }) => referenceInstance.SeriesDescription,
          },
        ],
        'viewportOverlay.topRight': [],
        'viewportOverlay.bottomLeft': [
          {
            id: 'WindowLevel',
            inheritsFrom: 'ohif.overlayItem.windowLevel',
          },
          {
            id: 'ZoomLevel',
            inheritsFrom: 'ohif.overlayItem.zoomLevel',
            condition: props => {
              const activeToolName = props.toolGroupService.getActiveToolForViewport(
                props.viewportId
              );
              return activeToolName === 'Zoom';
            },
          },
        ],
        'viewportOverlay.bottomRight': [
          {
            id: 'InstanceNumber',
            inheritsFrom: 'ohif.overlayItem.instanceNumber',
          },
        ],
        'cornerstone.overlayViewportTools': tools,
        'cornerstone.windowLevelPresets': defaultWindowLevelPresets,
        'cornerstone.colorbar': {
          width: '16px',
          colorbarTickPosition: 'left',
          colormaps,
          colorbarContainerPosition: 'right',
          colorbarInitialColormap: DefaultColormap,
        },
        'cornerstone.3dVolumeRendering': {
          volumeRenderingPresets: VIEWPORT_PRESETS,
          volumeRenderingQualityRange: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        'cornerstone.measurements': {
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
      },
    },
  ];
}

export default getCustomizationModule;
