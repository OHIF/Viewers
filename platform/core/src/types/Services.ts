import {
  HangingProtocolService,
  CustomizationService,
  MeasurementService,
  ViewportGridService,
  ToolbarService,
  DisplaySetService,
  StateSyncService,
  UINotificationService,
  UIModalService,
  SegmentationService,
  ToolGroupService,
} from '../services';
import CornerstoneViewportService from 'extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService';

/**
 * The interface for the services object
 */
export default interface Services {
  userAuthenticationService?: Record<string, unknown>;
  hangingProtocolService?: HangingProtocolService;
  customizationService?: CustomizationService;
  measurementService?: MeasurementService;
  displaySetService?: DisplaySetService;
  cineService?: Record<string, unknown>;
  toolbarService?: ToolbarService;
  cornerstoneViewportService?: CornerstoneViewportService;
  uiDialogService?: Record<string, unknown>;
  toolGroupService?: ToolGroupService;
  uiNotificationService?: UINotificationService;
  uiModalService?: UIModalService;
  uiViewportDialogService?: Record<string, unknown>;
  viewportGridService?: ViewportGridService;
  syncGroupService?: Record<string, unknown>;
  cornerstoneCacheService?: Record<string, unknown>;
  segmentationService?: SegmentationService;
  stateSyncService?: StateSyncService;
  panelService?: Record<string, unknown>;
}
