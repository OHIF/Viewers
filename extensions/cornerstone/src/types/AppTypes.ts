/* eslint-disable @typescript-eslint/no-namespace */
import CornerstoneCacheService from '../services/CornerstoneCacheService';
import CornerstoneViewportService from '../services/ViewportService/CornerstoneViewportService';
import SegmentationService from '../services/SegmentationService';
import SyncGroupService from '../services/SyncGroupService';
import ToolGroupService from '../services/ToolGroupService';
import ViewportActionCornersService from '../services/ViewportActionCornersService/ViewportActionCornersService';
import ColorbarService from '../services/ColorbarService';

declare global {
  namespace AppTypes {
    export interface Services {
      cornerstoneViewportService?: CornerstoneViewportService;
      toolGroupService?: ToolGroupService;
      syncGroupService?: SyncGroupService;
      segmentationService?: SegmentationService;
      cornerstoneCacheService?: CornerstoneCacheService;
      viewportActionCornersService?: ViewportActionCornersService;
      colorbarService?: ColorbarService;
    }
  }
}
