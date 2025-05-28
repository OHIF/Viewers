import { Types } from '@ohif/core';
import ToolGroupService from '../services/ToolGroupService';
import SyncGroupService from '../services/SyncGroupService';
import SegmentationService from '../services/SegmentationService';
import CornerstoneCacheService from '../services/CornerstoneCacheService';
import CornerstoneViewportService from '../services/ViewportService/CornerstoneViewportService';
import ColorbarService from '../services/ColorbarService';

interface CornerstoneServices extends Types.Services {
  cornerstoneViewportService: CornerstoneViewportService;
  toolGroupService: ToolGroupService;
  syncGroupService: SyncGroupService;
  segmentationService: SegmentationService;
  cornerstoneCacheService: CornerstoneCacheService;
  colorbarService: ColorbarService;
}

export default CornerstoneServices;
