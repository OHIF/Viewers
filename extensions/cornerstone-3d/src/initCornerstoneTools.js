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
  RectangleROITool,
  EllipticalROITool,
  BidirectionalTool,
  ArrowAnnotateTool,
  DragProbeTool,
  AngleTool,
  MagnifyTool,
  CrosshairsTool,
  RectangleROIStartEndThresholdTool,
  SegmentationDisplayTool,
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
  cornerstone3DTools.addTool(RectangleROITool);
  cornerstone3DTools.addTool(EllipticalROITool);
  cornerstone3DTools.addTool(BidirectionalTool);
  cornerstone3DTools.addTool(ArrowAnnotateTool);
  cornerstone3DTools.addTool(DragProbeTool);
  cornerstone3DTools.addTool(AngleTool);
  cornerstone3DTools.addTool(MagnifyTool);
  cornerstone3DTools.addTool(CrosshairsTool);
  cornerstone3DTools.addTool(SegmentationDisplayTool);
}

const toolNames = {
  Pan: PanTool.toolName,
  ArrowAnnotate: ArrowAnnotateTool.toolName,
  WindowLevel: WindowLevelTool.toolName,
  StackScroll: StackScrollTool.toolName,
  StackScrollMouseWheel: StackScrollMouseWheelTool.toolName,
  Zoom: ZoomTool.toolName,
  VolumeRotateMouseWheel: VolumeRotateMouseWheelTool.toolName,
  MipJumpToClick: MIPJumpToClickTool.toolName,
  Length: LengthTool.toolName,
  DragProbe: DragProbeTool.toolName,
  RectangleROI: RectangleROITool.toolName,
  EllipticalROI: EllipticalROITool.toolName,
  Bidirectional: BidirectionalTool.toolName,
  Angle: AngleTool.toolName,
  Magnify: MagnifyTool.toolName,
  Crosshairs: CrosshairsTool.toolName,
  SegmentationDisplay: SegmentationDisplayTool.toolName,
};

export { toolNames };
