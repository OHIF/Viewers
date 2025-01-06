import { Enums as csToolsEnums } from '@cornerstonejs/tools';
import { Types as csTypes } from '@cornerstonejs/core';

// Common parameter types
export type ViewportId = string;
export type SegmentationId = string;
export type SegmentIndex = number;
export type Label = string;

// Method parameter types
export type SegmentVisibilityParams = {
  viewportId: ViewportId;
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
  isVisible: boolean;
  type?: csToolsEnums.SegmentationRepresentations;
};

export type ToggleSegmentVisibilityParams = {
  viewportId: ViewportId;
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
  type: csToolsEnums.SegmentationRepresentations;
};

export type GetLabelmapVolumeParams = {
  segmentationId: SegmentationId;
};

export type SetSegmentLabelParams = {
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
  label: Label;
};

export type SetActiveSegmentParams = {
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
};

export type SetRenderInactiveSegmentationsParams = {
  viewportId: ViewportId;
  renderInactive: boolean;
};

export type SegmentLockedParams = {
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
  isLocked: boolean;
};

export type SetSegmentColorParams = {
  viewportId: ViewportId;
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
  color: csTypes.Color;
};

export type GetSegmentColorParams = {
  viewportId: ViewportId;
  segmentationId: SegmentationId;
  segmentIndex: SegmentIndex;
};
