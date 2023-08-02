import { Types } from '@ohif/core';
import ToolService from '../services/ToolService';
import ToolGroupService from '../services/ToolGroupService';
import SyncGroupService from '../services/SyncGroupService';
import SegmentationService from '../services/SegmentationService';
import CornerstoneCacheService from '../services/CornerstoneCacheService';
import CornerstoneViewportService from '../services/ViewportService/CornerstoneViewportService';

interface CornerstoneServices extends Types.Services {
  cornerstoneViewportService: CornerstoneViewportService;
  toolService: ToolService;
  toolGroupService: ToolGroupService;
  syncGroupService: SyncGroupService;
  segmentationService: SegmentationService;
  cornerstoneCacheService: CornerstoneCacheService;
}

export default CornerstoneServices;
