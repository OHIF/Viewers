import {
  DEFAULT_SEG_STORE_MODE,
  DEFAULT_SEG_STORE_TRANSFER_SYNTAX_UID,
  type SegmentationMode,
} from '../utils/segmentationConfig';

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

/** Extension-registered defaults: Label Map SEG + RLE Lossless. */
const segmentationCustomization = {
  'segmentation.store.defaultMode': DEFAULT_SEG_STORE_MODE,
  'segmentation.store.transferSyntaxUID': DEFAULT_SEG_STORE_TRANSFER_SYNTAX_UID,
  'segmentation.segmentLabel': {
    enabledByDefault: false,
    hoverTimeout: 1,
  } satisfies SegmentLabelCustomization,
};

export default segmentationCustomization;
