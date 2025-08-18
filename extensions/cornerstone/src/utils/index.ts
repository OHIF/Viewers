import { handleSegmentChange } from './segmentUtils';
import { isReferenceViewable } from './isReferenceViewable';
import {
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
} from './segmentationHandlers';
import promptHydrationDialog, {
  HydrationDialogProps,
  HydrationCallback,
  HydrationSRResult,
} from './promptHydrationDialog';
import { handleJumpToMeasurement } from './handleJumpToMeasurement';

const utils = {
  handleSegmentChange,
  isReferenceViewable,
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
  promptHydrationDialog,
  handleJumpToMeasurement,
};

export type { HydrationDialogProps, HydrationCallback, HydrationSRResult };

export default utils;
