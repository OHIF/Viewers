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
  RBACService,
  PanelService,
  UIDialogService,
  UIViewportDialogService,
} from '../services';

/**
 * The interface for the services object
 */

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
  uiDialogService?: UIDialogService;
  uiViewportDialogService?: UIViewportDialogService;
  panelService?: PanelService;
  rbacService?: RBACService;
}

export default Services;
