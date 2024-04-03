import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import DicomUpload from './components/DicomUpload/DicomUpload';
import ViewportWindowLevel from './components/ViewportWindowLevel';
import ActiveViewportWindowLevel from './components/ActiveViewportWindowLevel';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';
import { CONSTANTS } from '@cornerstonejs/core';

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
    { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
  ],
  enabled: [{ toolName: toolNames.SegmentationDisplay }],
};

function getCustomizationModule() {
  return [
    {
      name: 'cornerstoneDicomUploadComponent',
      value: {
        id: 'dicomUploadComponent',
        component: DicomUpload,
      },
    },
    {
      name: 'default',
      value: [
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
      ],
    },
    {
      name: 'cornerstoneViewportWindowLevelComponent',
      value: {
        id: 'viewportWindowLevelComponent',
        component: ViewportWindowLevel,
      },
    },
    {
      name: 'cornerstoneActiveViewportWindowLevelComponent',
      value: {
        id: 'activeViewportWindowLevelComponent',
        component: ActiveViewportWindowLevel,
      },
    },
  ];
}

export default getCustomizationModule;
