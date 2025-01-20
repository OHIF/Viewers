import { Enums as csToolsEnums, Types as cstTypes } from '@cornerstonejs/tools';
import { Types } from '@cornerstonejs/core';

type SegmentationConfig = cstTypes.LabelmapTypes.LabelmapConfig & {
  renderInactiveSegmentations: boolean;
  brushSize: number;
  brushThresholdGate: number;
};

type Segment = {
  // the label for the segment
  label: string;
  // the index of the segment in the segmentation
  segmentIndex: number;
  // the color of the segment
  color: Types.Point3;
  // the opacity of the segment
  opacity: number;
  // whether the segment is visible
  isVisible: boolean;
  // whether the segment is locked
  isLocked: boolean;
  // display texts
  displayText?: string[];
  // The name of algorithm used to generate the segment. (0062,0009)
  algorithmName?: string;
  // Type of algorithm used to generate the segment. 	(0062,0008)
  algorithmType?: string;
};

type Segmentation = {
  // active segment index is the index of the segment that is currently being edited.
  activeSegmentIndex: number;
  // colorLUTIndex is the index of the color LUT that is currently being used.
  colorLUTIndex: number;
  // if segmentation contains any data (often calculated from labelmap)
  cachedStats: Record<string, any>;
  // displaySetInstanceUID
  displaySetInstanceUID: string;
  // displayText is the text that is displayed on the segmentation panel (often derived from the data)
  displayText?: string[];
  // the id of the segmentation
  id: string;
  // if the segmentation is the active segmentation being used in the viewer
  isActive: boolean;
  // if the segmentation is visible in the viewer
  isVisible: boolean;
  // the frame of reference UID of the segmentation
  FrameOfReferenceUID: string;
  // the label of the segmentation
  label: string;
  // the number of segments in the segmentation
  segmentCount: number;
  // the array of segments with their details, [null, segment1, segment2, ...]
  segments: Array<Segment>;
  // the set of segments that are locked
  segmentsLocked: Array<number>;
  // whether the segmentation is hydrated or not (non-hydrated SEG -> temporary segmentation for display in SEG Viewport
  // but hydrated SEG -> segmentation that is persisted in the store)
  hydrated: boolean;
  // the type of the segmentation (e.g., Labelmap etc.)
  type: csToolsEnums.SegmentationRepresentations;
  // the segmentation representation data
  representationData: SegmentationRepresentationData;
};

type LabelmapSegmentationData = {
  volumeId: string;
  referencedVolumeId?: string;
};

type SegmentationRepresentationData = {
  LABELMAP?: LabelmapSegmentationData;
};

export type { SegmentationConfig, Segment, Segmentation };
