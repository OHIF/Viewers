import * as cornerstone3DTools from '@cornerstonejs/tools';

const {
  PanTool,
  WindowLevelTool,
  StackScrollTool,
  StackScrollMouseWheelTool,
  ZoomTool,
  VolumeRotateMouseWheelTool,
  MIPJumpToClickTool,
  LengthTool,
  ProbeTool,
  RectangleROITool,
  EllipticalROITool,
  BidirectionalTool,
  ArrowTool,
  // CrosshairsTool,
} = cornerstone3DTools;

export default function initCornerstone3DTools(configuration = {}) {
  cornerstone3DTools.init(configuration);

  cornerstone3DTools.addTool(PanTool);
  cornerstone3DTools.addTool(WindowLevelTool);
  cornerstone3DTools.addTool(StackScrollMouseWheelTool);
  cornerstone3DTools.addTool(StackScrollTool);
  cornerstone3DTools.addTool(ZoomTool);
  cornerstone3DTools.addTool(VolumeRotateMouseWheelTool);
  cornerstone3DTools.addTool(MIPJumpToClickTool);
  cornerstone3DTools.addTool(LengthTool);
  // cornerstone3DTools.addTool(ProbeTool); // Needs proper mapper
  cornerstone3DTools.addTool(RectangleROITool);
  cornerstone3DTools.addTool(EllipticalROITool);
  cornerstone3DTools.addTool(BidirectionalTool);
  cornerstone3DTools.addTool(ArrowTool);
  // cornerstone3DTools.addTool(CrosshairsTool);
}

const toolNames = {
  Pan: PanTool.toolName,
  Arrow: ArrowTool.toolName,
  WindowLevel: WindowLevelTool.toolName,
  StackScroll: StackScrollTool.toolName,
  StackScrollMouseWheel: StackScrollMouseWheelTool.toolName,
  Zoom: ZoomTool.toolName,
  VolumeRotateMouseWheel: VolumeRotateMouseWheelTool.toolName,
  MipJumpToClick: MIPJumpToClickTool.toolName,
  Length: LengthTool.toolName,
  Probe: ProbeTool.toolName,
  RectangleROI: RectangleROITool.toolName,
  EllipticalROI: EllipticalROITool.toolName,
  Bidirectional: BidirectionalTool.toolName,
  // crosshairs: CrosshairsTool.toolName,
};

export { toolNames };
