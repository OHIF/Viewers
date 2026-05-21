import type { SegmentationMode } from '../utils/segmentationConfig';

export type SegmentLabelCustomization = {
  enabledByDefault?: boolean;
  labelColor?: number[];
  hoverTimeout?: number;
  background?: string;
};

export type SegmentationStoreCustomization = {
  defaultMode?: SegmentationMode;
  transferSyntaxUID?: string;
};

const segmentationCustomization = {
  'segmentation.store.defaultMode': 'labelmap' as SegmentationMode,
  // transferSyntaxUID is configured in app config (customizationService), not here.
  'segmentation.segmentLabel': {
    enabledByDefault: false,
    hoverTimeout: 1,
  } satisfies SegmentLabelCustomization,
};

export default segmentationCustomization;
