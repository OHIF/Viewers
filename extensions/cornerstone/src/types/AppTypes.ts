/* eslint-disable @typescript-eslint/no-namespace */
import CornerstoneCacheServiceType from '../services/CornerstoneCacheService';
import CornerstoneViewportServiceType from '../services/ViewportService/CornerstoneViewportService';
import SegmentationServiceType from '../services/SegmentationService';
import SyncGroupServiceType from '../services/SyncGroupService';
import ToolGroupServiceType from '../services/ToolGroupService';
import ViewportActionCornersServiceType from '../services/ViewportActionCornersService/ViewportActionCornersService';
import ColorbarServiceType from '../services/ColorbarService';

declare global {
  namespace AppTypes {
    export interface Services {
      cornerstoneViewportService?: CornerstoneViewportServiceType;
      toolGroupService?: ToolGroupServiceType;
      syncGroupService?: SyncGroupServiceType;
      segmentationService?: SegmentationServiceType;
      cornerstoneCacheService?: CornerstoneCacheServiceType;
      viewportActionCornersService?: ViewportActionCornersServiceType;
      colorbarService?: ColorbarServiceType;
    }
    type CornerstoneViewportService = CornerstoneViewportServiceType;
    type ToolGroupService = ToolGroupServiceType;
    type SyncGroupService = SyncGroupServiceType;
    type SegmentationService = SegmentationServiceType;
    type CornerstoneCacheService = CornerstoneCacheServiceType;
    type ViewportActionCornersService = ViewportActionCornersServiceType;
    type ColorbarService = ColorbarServiceType;
  }
}
