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
  'segmentation.store.transferSyntaxUID': '1.2.840.10008.1.2.5',
  'segmentation.segmentLabel': {
    enabledByDefault: false,
    hoverTimeout: 1,
  } satisfies SegmentLabelCustomization,
};

export default segmentationCustomization;
