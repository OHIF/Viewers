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
} from '../services';

/**
 * The interface for the services object
 */
export default interface Services {
  hangingProtocolService?: HangingProtocolService;
  customizationService?: CustomizationService;
  measurementService?: MeasurementService;
  displaySetService?: DisplaySetService;
  toolbarService?: ToolbarService;
  viewportGridService?: ViewportGridService;
  uiModalService?: UIModalService;
  uiNotificationService?: UINotificationService;
  stateSyncService?: StateSyncService;
  cineService?: unknown;
  userAuthenticationService?: unknown;
  cornerstoneViewportService?: unknown;
  uiDialogService?: unknown;
  toolGroupService?: unknown;
  uiViewportDialogService?: unknown;
  syncGroupService?: unknown;
  cornerstoneCacheService?: unknown;
  segmentationService?: unknown;
  panelService?: unknown;
}
