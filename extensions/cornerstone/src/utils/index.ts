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
import { getCenterExtent } from './getCenterExtent';
import { createSegmentationForViewport } from './createSegmentationForViewport';

const utils = {
  handleSegmentChange,
  isReferenceViewable,
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
  promptHydrationDialog,
  getCenterExtent,
  createSegmentationForViewport,
};

export type { HydrationDialogProps, HydrationCallback, HydrationSRResult };

export default utils;
