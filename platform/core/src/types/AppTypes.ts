/* eslint-disable @typescript-eslint/no-namespace */
import HangingProtocolService from '../services/HangingProtocolService';
import CustomizationService from '../services/CustomizationService';
import MeasurementService from '../services/MeasurementService';
import ViewportGridService from '../services/ViewportGridService';
import ToolbarService from '../services/ToolBarService';
import DisplaySetService from '../services/DisplaySetService';
import StateSyncService from '../services/StateSyncService';
import UINotificationService from '../services/UINotificationService';
import UIModalService from '../services/UIModalService';
import WorkflowStepsService from '../services/WorkflowStepsService';
import CineService from '../services/CineService';
import UserAuthenticationService from '../services/UserAuthenticationService';
import PanelService from '../services/PanelService';
import UIDialogService from '../services/UIDialogService';
import UIViewportDialogService from '../services/UIViewportDialogService';

import ServicesManagerType from '../services/ServicesManager';
import CommandsManagerType from '../classes/CommandsManager';
import ExtensionManagerType from '../extensions/ExtensionManager';

declare global {
  namespace AppTypes {
    export type ServicesManager = ServicesManagerType;
    export type CommandsManager = CommandsManagerType;
    export type ExtensionManager = ExtensionManagerType;

    export interface Managers {
      servicesManager?: ServicesManager;
      commandsManager?: CommandsManager;
      extensionManager?: ExtensionManager;
    }

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

  export type withAppTypes<T = object> = T &
    AppTypes.Services &
    AppTypes.Managers & {
      [key: string]: any;
    };
}
