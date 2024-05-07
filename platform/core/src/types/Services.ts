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
  PanelService,
  UIDialogService,
  UIViewportDialogService,
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
    uiDialogService?: UIDialogService;
    uiViewportDialogService?: UIViewportDialogService;
    panelService?: PanelService;
  }

  type hangingProtocolService = HangingProtocolService;
  type customizationService = CustomizationService;
  type measurementService = MeasurementService;
  type displaySetService = DisplaySetService;
  type toolbarService = ToolbarService;
  type viewportGridService = ViewportGridService;
  type uiModalService = UIModalService;
  type uiNotificationService = UINotificationService;
  type stateSyncService = StateSyncService;
  type workflowStepsService = WorkflowStepsService;
  type cineService = CineService;
  type userAuthenticationService = UserAuthenticationService;
  type uiDialogService = UIDialogService;
  type uiViewportDialogService = UIViewportDialogService;
  type panelService = PanelService;
}

export default Services;
