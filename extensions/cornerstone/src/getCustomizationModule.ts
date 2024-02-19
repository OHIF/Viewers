import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import DicomUpload from './components/DicomUpload/DicomUpload';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';

const DefaultColormap = 'Grayscale';

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
      ],
    },
  ];
}

export default getCustomizationModule;
