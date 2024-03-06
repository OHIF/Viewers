import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import DicomUpload from './components/DicomUpload/DicomUpload';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';
import { CONSTANTS } from '@cornerstonejs/core';

const DefaultColormap = 'Grayscale';
const { VIEWPORT_PRESETS } = CONSTANTS;
const defaultViewportQualityPresets = [
  { label: 'Good', value: 1 },
  { label: 'Better', value: 2 },
  { label: 'Ultra', value: 3 },
  { label: 'Extreme', value: 4 },
];

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
          width: '2.5%',
          colorbarTickPosition: 'left',
          colormaps,
          colorbarContainerPosition: 'right',
          colorbarInitialColormap: DefaultColormap,
        },
        {
          id: 'cornerstone.3dVolumeRendering',
          viewportPresets: VIEWPORT_PRESETS,
          viewportQualityPresets: defaultViewportQualityPresets,
        },
      ],
    },
  ];
}

export default getCustomizationModule;
