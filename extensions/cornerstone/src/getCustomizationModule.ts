import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';

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
      name: 'default',
      value: [
        {
          id: 'cornerstone.overlayViewportTools',
          tools,
        },
      ],
    },
  ];
}

export default getCustomizationModule;
