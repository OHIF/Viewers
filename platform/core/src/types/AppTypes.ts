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
import CommandsManagerType from '../classes/CommandsManager';
import ExtensionManagerType from '../extensions/ExtensionManager';

import Hotkey from '../classes/Hotkey';

declare global {
  namespace AppTypes {
    export type ServicesManager = ServicesManagerType;
    export type CommandsManager = CommandsManagerType;
    export type ExtensionManager = ExtensionManagerType;
    export type HangingProtocolService = HangingProtocolServiceType;
    export type CustomizationService = CustomizationServiceType;
    export type MeasurementService = MeasurementServiceType;
    export type DisplaySetService = DisplaySetServiceType;
    export type ToolbarService = ToolbarServiceType;
    export type ViewportGridService = ViewportGridServiceType;
    export type UIModalService = UIModalServiceType;
    export type UINotificationService = UINotificationServiceType;
    export type StateSyncService = StateSyncServiceType;
    export type WorkflowStepsService = WorkflowStepsServiceType;
    export type CineService = CineServiceType;
    export type UserAuthenticationService = UserAuthenticationServiceType;
    export type UIDialogService = UIDialogServiceType;
    export type UIViewportDialogService = UIViewportDialogServiceType;
    export type PanelService = PanelServiceType;

    export interface Managers {
      servicesManager?: ServicesManager;
      commandsManager?: CommandsManager;
      extensionManager?: ExtensionManager;
    }

    export interface Services {
      hangingProtocolService?: HangingProtocolServiceType;
      customizationService?: CustomizationServiceType;
      measurementService?: MeasurementServiceType;
      displaySetService?: DisplaySetServiceType;
      toolbarService?: ToolbarServiceType;
      viewportGridService?: ViewportGridServiceType;
      uiModalService?: UIModalServiceType;
      uiNotificationService?: UINotificationServiceType;
      stateSyncService?: StateSyncServiceType;
      workflowStepsService?: WorkflowStepsServiceType;
      cineService?: CineServiceType;
      userAuthenticationService?: UserAuthenticationServiceType;
      uiDialogService?: UIDialogServiceType;
      uiViewportDialogService?: UIViewportDialogServiceType;
      panelService?: PanelServiceType;
    }
    export interface Config {
      routerBasename?: string;
      customizationService?: any;
      extensions?: string[];
      modes?: string[];
      experimentalStudyBrowserSort?: boolean;
      defaultDataSourceName?: string;
      hotkeys?: Record<string, Hotkey> | Hotkey[];
      useSharedArrayBuffer?: 'AUTO' | 'FALSE' | 'TRUE';
      preferSizeOverAccuracy?: boolean;
      useNorm16Texture?: boolean;
      useCPURendering?: boolean;
      strictZSpacingForVolumeViewport?: boolean;
      useCursors?: boolean;
      maxCacheSize?: number;
      max3DTextureSize?: number;
      showWarningMessageForCrossOrigin?: boolean;
      showCPUFallbackMessage?: boolean;
      maxNumRequests?: {
        interaction?: number;
        prefetch?: number;
        thumbnail?: number;
      };
      disableEditing?: boolean;
      maxNumberOfWebWorkers?: number;
      acceptHeader?: string[];
      investigationalUseDialog?: {
        option: 'always' | 'never' | 'configure';
        days?: number;
      };
      groupEnabledModesFirst?: boolean;
      disableConfirmationPrompts?: boolean;
      showPatientInfo?: 'visible' | 'visibleCollapsed' | 'disabled' | 'visibleReadOnly';
      requestTransferSyntaxUID?: string;
      omitQuotationForMultipartRequest?: boolean;
      modesConfiguration?: {
        [key: string]: object;
      };
      showLoadingIndicator?: boolean;
      supportsWildcard?: boolean;
      allowMultiSelectExport?: boolean;
      activateViewportBeforeInteraction?: boolean;
      autoPlayCine?: boolean;
      showStudyList?: boolean;
      whiteLabeling?: any;
      httpErrorHandler?: any;
      addWindowLevelActionMenu?: boolean;
      dangerouslyUseDynamicConfig?: {
        enabled: boolean;
        regex: RegExp;
      };
      onConfiguration?: (dicomWebConfig: any, options: any) => any;
      dataSources?: any;
      oidc?: any;
    }

    export interface Test {
      services?: Services;
      commandsManager?: CommandsManager;
      extensionManager?: ExtensionManager;
      config?: Config;
    }
  }

  export type withAppTypes<T = object> = T &
    AppTypes.Services &
    AppTypes.Managers & {
      [key: string]: any;
    };
}
