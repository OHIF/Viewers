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
  WorkflowStepsService,
  CineService,
  UserAuthenticationService,
} from '../services';

/**
 * The interface for the services object
 */

declare global {
  interface Services {
    hangingProtocolService?: HangingProtocolService;
    customizationService?: CustomizationService;
    measurementService?: MeasurementService;
    displaySetService?: DisplaySetService;
    toolbarService?: ToolbarService;
    viewportGridService?: ViewportGridService;
    uiModalService?: UIModalService;
    uiNotificationService?: UINotificationService;
    stateSyncService?: StateSyncService;
    workflowStepsService: WorkflowStepsService;
    cineService?: CineService;
    userAuthenticationService?: UserAuthenticationService;
    cornerstoneViewportService?: unknown;
    uiDialogService?: unknown;
    toolGroupService?: unknown;
    uiViewportDialogService?: unknown;
    syncGroupService?: unknown;
    cornerstoneCacheService?: unknown;
    segmentationService?: unknown;
    panelService?: unknown;
    colorbarService?: unknown;
  }
}

export default Services;
