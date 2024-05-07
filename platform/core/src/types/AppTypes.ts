/* eslint-disable @typescript-eslint/no-namespace */
import HangingProtocolServiceType from '../services/HangingProtocolService';
import CustomizationServiceType from '../services/CustomizationService';
import MeasurementServiceType from '../services/MeasurementService';
import ViewportGridServiceType from '../services/ViewportGridService';
import ToolbarServiceType from '../services/ToolBarService';
import DisplaySetServiceType from '../services/DisplaySetService';
import StateSyncServiceType from '../services/StateSyncService';
import UINotificationServiceType from '../services/UINotificationService';
import UIModalServiceType from '../services/UIModalService';
import WorkflowStepsServiceType from '../services/WorkflowStepsService';
import CineServiceType from '../services/CineService';
import UserAuthenticationServiceType from '../services/UserAuthenticationService';
import PanelServiceType from '../services/PanelService';
import UIDialogServiceType from '../services/UIDialogService';
import UIViewportDialogServiceType from '../services/UIViewportDialogService';
import ServicesManagerType from '../services/ServicesManager';

declare global {
  namespace AppTypes {
    type ServicesManager = ServicesManagerType;
    type HangingProtocolService = HangingProtocolServiceType;
    type CustomizationService = CustomizationServiceType;
    type MeasurementService = MeasurementServiceType;
    type ViewportGridService = ViewportGridServiceType;
    type ToolbarService = ToolbarServiceType;
    type DisplaySetService = DisplaySetServiceType;
    type StateSyncService = StateSyncServiceType;
    type UINotificationService = UINotificationServiceType;
    type UIModalService = UIModalServiceType;
    type WorkflowStepsService = WorkflowStepsServiceType;
    type CineService = CineServiceType;
    type UserAuthenticationService = UserAuthenticationServiceType;
    type PanelService = PanelServiceType;
    type UIDialogService = UIDialogServiceType;
    type UIViewportDialogService = UIViewportDialogServiceType;
    export interface Services {
      hangingProtocolService?: HangingProtocolService;
      customizationService?: CustomizationService;
      measurementService?: MeasurementService;
      displaySetService?: DisplaySetService;
      toolbarService?: ToolbarService;
      viewportGridService?: ViewportGridService;
      uiModalService?: UIModalService;
      uiNotificationService?: UINotificationService;
      stateSyncService?: StateSyncService;
      workflowStepsService?: WorkflowStepsService;
      cineService?: CineService;
      userAuthenticationService?: UserAuthenticationService;
      uiDialogService?: UIDialogService;
      uiViewportDialogService?: UIViewportDialogService;
      panelService?: PanelService;
    }
  }

  interface withAppTypes<T = object> {
    [key: string]: any;
    servicesManager: AppTypes.ServicesManager;
  }
}
