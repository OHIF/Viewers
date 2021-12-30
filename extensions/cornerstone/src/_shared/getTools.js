import csTools from 'cornerstone-tools';
import NLCrosshairsTool from '../tools/NLCrosshairs';

const toolsGroupedByType = {
  touch: [csTools.PanMultiTouchTool, csTools.ZoomTouchPinchTool],
  annotations: [
    csTools.ArrowAnnotateTool,
    csTools.BidirectionalTool,
    csTools.LengthTool,
    csTools.AngleTool,
    csTools.FreehandRoiTool,
    csTools.EllipticalRoiTool,
    csTools.DragProbeTool,
    csTools.RectangleRoiTool,
  ],
  other: [
    csTools.PanTool,
    csTools.ZoomTool,
    csTools.RotateTool,
    csTools.WwwcTool,
    csTools.WwwcRegionTool,
    csTools.MagnifyTool,
    csTools.StackScrollTool,
    csTools.StackScrollMouseWheelTool,
    csTools.OverlayTool,
  ],
};

export default function getTools() {
  const tools = [];
  Object.keys(toolsGroupedByType).forEach(toolsGroup =>
    tools.push(...toolsGroupedByType[toolsGroup])
  );

  return tools;
}

export { toolsGroupedByType };
