/* eslint-disable @typescript-eslint/no-namespace */
import HangingProtocolServiceType from '../services/HangingProtocolService';
import CustomizationServiceType from '../services/CustomizationService';
import type { PhasedCustomizationConfig } from '../services/CustomizationService';
import MeasurementServiceType from '../services/MeasurementService';
import ViewportGridServiceType from '../services/ViewportGridService';
import ToolbarServiceType from '../services/ToolBarService';
import DisplaySetServiceType from '../services/DisplaySetService';
import UINotificationServiceType from '../services/UINotificationService';
import UIModalServiceType from '../services/UIModalService';
import WorkflowStepsServiceType from '../services/WorkflowStepsService';
import CineServiceType from '../services/CineService';
import UserAuthenticationServiceType from '../services/UserAuthenticationService';
import PanelServiceType from '../services/PanelService';
import UIDialogServiceType from '../services/UIDialogService';
import UIViewportDialogServiceType from '../services/UIViewportDialogService';
import StudyPrefetcherServiceType from '../services/StudyPrefetcherService';
import type { MultiMonitorService } from '../services/MultiMonitorService';

import ServicesManagerType from '../services/ServicesManager';
import CommandsManagerType from '../classes/CommandsManager';
import ExtensionManagerType from '../extensions/ExtensionManager';

import Hotkey from '../classes/Hotkey';

import * as CommandTypes from './Command';
import * as ColorTypes from './Color';
import * as ConsumerTypes from './Consumer';
import * as DataSourceTypes from './DataSource';
import * as DataSourceConfigurationAPITypes from './DataSourceConfigurationAPI';
import * as DisplaySetTypes from './DisplaySet';
import * as HangingProtocolTypes from './HangingProtocol';
import * as IPubSubTypes from './IPubSub';
import * as PanelModuleTypes from './PanelModule';
import * as StudyMetadataTypes from './StudyMetadata';
import * as ViewportGridTypes from './ViewportGridType';

import { StepOptions, TourOptions } from 'shepherd.js';

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
    export type WorkflowStepsService = WorkflowStepsServiceType;
    export type CineService = CineServiceType;
    export type UserAuthenticationService = UserAuthenticationServiceType;
    export type UIDialogService = UIDialogServiceType;
    export type UIViewportDialogService = UIViewportDialogServiceType;
    export type PanelService = PanelServiceType;
    export type StudyPrefetcherService = StudyPrefetcherServiceType;

    export interface Managers {
      servicesManager?: ServicesManager;
      commandsManager?: CommandsManager;
      extensionManager?: ExtensionManager;
    }

    /**
     * Registry mapping customization ids to their resolved value types.
     *
     * Seeded empty here; each extension (in-tree or third-party) merges the
     * keys it owns via declaration merging, the same way `AppTypes.Services`
     * is extended:
     *
     * ```ts
     * declare global {
     *   namespace AppTypes {
     *     interface Customizations {
     *       'viewportOverlay.topLeft': OverlayItem[];
     *       'panelSegmentation.disableEditing': boolean;
     *     }
     *   }
     * }
     * ```
     *
     * Keys registered here get autocomplete and a precise return type on
     * `customizationService.getCustomization` / value checking on
     * `setCustomizations`. Ids not in the registry (e.g. dynamic, computed
     * keys) still work through the plain-string fallback overloads.
     *
     * Declare a key's type with `| undefined` when no default is shipped for
     * it, so consumers are forced to handle its absence.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
    export interface Customizations {}

    export interface Services {
      hangingProtocolService?: HangingProtocolServiceType;
      customizationService?: CustomizationServiceType;
      measurementService?: MeasurementServiceType;
      displaySetService?: DisplaySetServiceType;
      toolbarService?: ToolbarServiceType;
      viewportGridService?: ViewportGridServiceType;
      uiModalService?: UIModalServiceType;
      uiNotificationService?: UINotificationServiceType;
      workflowStepsService?: WorkflowStepsServiceType;
      cineService?: CineServiceType;
      userAuthenticationService?: UserAuthenticationServiceType;
      uiDialogService?: UIDialogServiceType;
      uiViewportDialogService?: UIViewportDialogServiceType;
      panelService?: PanelServiceType;
      studyPrefetcherService?: StudyPrefetcherServiceType;
      multiMonitorService?: MultiMonitorService;
    }

    export interface Config {
      studyBrowserMode?: 'all' | 'primary';
      routerBasename?: string;
      /**
       * Startup customizations. Two forms are accepted:
       *
       *   - **Legacy**: an array of references / object map applied to the Global
       *     scope during `init()` (e.g.
       *     `['@ohif/extension-default.customizationModule.datasources']`).
       *   - **Phase-tagged** ({@link PhasedCustomizationConfig}): an object with
       *     any of `requires` / `bootstrap` / `global` / `mode`. `requires`
       *     pulls in URL-style customization data files; `bootstrap` /
       *     `global` apply (Global scope) before / after extensions register; and
       *     `mode` applies (Mode scope) per mode on entry — the `*` block to all
       *     modes first, then a block keyed by the mode id / routeName.
       */
      customizationService?: PhasedCustomizationConfig | string[] | Record<string, unknown>;
      /**
       * Allowlist of prefixes for the `?customization=` URL parameter, mapping a
       * prefix to a base URL/path. The `default` prefix (no slashes) handles
       * values with no leading slash; every other prefix must start and end with
       * a slash (e.g. `/remote/`). Intentionally an app-config property and not a
       * customization so a URL-loaded customization cannot widen its own
       * allowlist. Absent (the default) means `?customization=` is disabled.
       */
      customizationUrlPrefixes?: Record<string, string>;
      extensions?: string[];
      modes?: string[];
      experimentalStudyBrowserSort?: boolean;
      defaultDataSourceName?: string;
      hotkeys?: Record<string, Hotkey> | Hotkey[];
      preferSizeOverAccuracy?: boolean;
      useNorm16Texture?: boolean;
      useCPURendering?: boolean;
      strictZSpacingForVolumeViewport?: boolean;
      /**
       * Routes legacy cornerstone viewport types (STACK / ORTHOGRAPHIC / VOLUME_3D / etc.)
       * through the new GenericViewport-backed render paths while preserving the legacy
       * public API via compatibility adapters. Maps to cornerstone
       * config.rendering.useGenericViewport. Defaults to false (legacy classes).
       * Requires @cornerstonejs/core >= 5.0.0-beta (GenericViewport architecture).
       */
      useGenericViewport?: boolean;
      /**
       * Opt-in: drive viewports through the DIRECT native GenericViewport ("next")
       * API surface — `PLANAR_NEXT` / `VOLUME_3D_NEXT` / etc. created natively and
       * driven with `setDisplaySets`, `setDisplaySetPresentation`, `setViewState`
       * and view references — rather than the legacy `setStack` / `setVolumes` /
       * `setProperties` / `getCamera` / `setCamera` methods.
       *
       * This is distinct from (and overrides) `useGenericViewport`: that flag only
       * routes legacy viewport types through cornerstone's compatibility adapters
       * (`rendering.useGenericViewport`), keeping the legacy method surface. This
       * flag instead selects native viewport types in `getCornerstoneViewportType`
       * and the native data/presentation/view-state APIs inside
       * `CornerstoneViewportService` (the `nextBackend`). It does NOT set
       * cornerstone's `rendering.useGenericViewport`.
       *
       * Defaults to false (the legacy path, byte-identical to today). Opt-in only;
       * the community is not force-migrated.
       * Requires @cornerstonejs/core >= 5.0.x with the GenericViewport "next" APIs.
       */
      genericViewports?: {
        /**
         * Opt-in for the native path described above. Equivalent to (and
         * overridable by) the `?useNextViewports=true` URL param.
         */
        enabled?: boolean;
        /**
         * Render backend selection for viewports. Either a backend for all
         * viewports ('cpu' | 'webgl' | 'auto' | a wire id registered via
         * cornerstone's `registerRenderBackend`, e.g. a webgpu backend) or a map
         * of per-viewport-type overrides plus an optional 'default', e.g.
         * `{ default: 'webgl', orthographic: 'cpu' }`. The matching URL params
         * (`?viewportRendering=cpu`, `?orthographic.viewportRendering=cpu`) take
         * precedence per-session. 'webgl' aliases cornerstone's 'gpu' backend.
         * The default/global value also drives the legacy useCPURendering flag
         * ('cpu' → true, 'webgl' → false) so legacy viewports follow the same
         * selection.
         */
        viewportRendering?: string | Record<string, string>;
      };
      useCursors?: boolean;
      maxCacheSize?: number;
      max3DTextureSize?: number;
      showWarningMessageForCrossOrigin?: boolean;
      showCPUFallbackMessage?: boolean;
      maxNumRequests?: {
        interaction?: number;
        prefetch?: number;
        thumbnail?: number;
        compute?: number;
      };
      maxNumberOfWebWorkers?: number;
      acceptHeader?: string[];
      investigationalUseDialog?: {
        option: 'always' | 'never' | 'configure';
        days?: number;
      };
      groupEnabledModesFirst?: boolean;
      measurementTrackingMode?: 'standard' | 'simplified' | 'none';
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
      whiteLabeling?: Record<string, unknown>;
      httpErrorHandler?: (error: Error) => void;
      dangerouslyUseDynamicConfig?: {
        enabled: boolean;
        regex: RegExp;
      };
      onConfiguration?: (
        dicomWebConfig: Record<string, unknown>,
        options: Record<string, unknown>
      ) => Record<string, unknown>;
      dataSources?: Record<string, unknown>;
      oidc?: Record<string, unknown>;
      peerImport?: (moduleId: string) => Promise<Record<string, unknown>>;
      studyPrefetcher?: {
        enabled: boolean;
        displaySetsCount: number;
        maxNumPrefetchRequests: number;
        order: 'closest' | 'downward' | 'upward';
      };
    }

    export interface Test {
      services?: Services;
      commandsManager?: CommandsManager;
      extensionManager?: ExtensionManager;
      config?: Config;
    }

    // Add Command namespace to AppTypes
    export namespace Commands {
      export type SimpleCommand = CommandTypes.SimpleCommand;
      export type ComplexCommand = CommandTypes.ComplexCommand;
      export type Command = CommandTypes.Command;
      export type RunCommand = CommandTypes.RunCommand;
      export interface Commands extends CommandTypes.Commands {}
    }

    // Color types
    export type RGB = ColorTypes.RGB;

    // Consumer types
    export type Consumer = ConsumerTypes.Consumer;

    // DataSource types
    export type DataSourceDefinition = DataSourceTypes.DataSourceDefinition;

    // DataSourceConfigurationAPI types
    export namespace DataSourceConfiguration {
      export type BaseDataSourceConfigurationAPIItem =
        DataSourceConfigurationAPITypes.BaseDataSourceConfigurationAPIItem;
      export type BaseDataSourceConfigurationAPI =
        DataSourceConfigurationAPITypes.BaseDataSourceConfigurationAPI;
    }

    // DisplaySet types
    export type DisplaySet = DisplaySetTypes.DisplaySet;
    export type DisplaySetSeriesMetadataInvalidatedEvent =
      DisplaySetTypes.DisplaySetSeriesMetadataInvalidatedEvent;

    // HangingProtocol types
    export namespace HangingProtocol {
      export type DisplaySetInfo = HangingProtocolTypes.DisplaySetInfo;
      export type ViewportMatchDetails = HangingProtocolTypes.ViewportMatchDetails;
      export type DisplaySetMatchDetails = HangingProtocolTypes.DisplaySetMatchDetails;
      export type DisplaySetAndViewportOptions = HangingProtocolTypes.DisplaySetAndViewportOptions;
      export type DisplayArea = HangingProtocolTypes.DisplayArea;
      export type SetProtocolOptions = HangingProtocolTypes.SetProtocolOptions;
      export type HangingProtocolMatchDetails = HangingProtocolTypes.HangingProtocolMatchDetails;
      export type ConstraintValue = HangingProtocolTypes.ConstraintValue;
      export type Constraint = HangingProtocolTypes.Constraint;
      export type MatchingRule = HangingProtocolTypes.MatchingRule;
      export type ViewportLayoutOptions = HangingProtocolTypes.ViewportLayoutOptions;
      export type ViewportStructure = HangingProtocolTypes.ViewportStructure;
      export type DisplaySetSelector = HangingProtocolTypes.DisplaySetSelector;
      export type SyncGroup = HangingProtocolTypes.SyncGroup;
      export type CustomOptionAttribute<T> = HangingProtocolTypes.CustomOptionAttribute<T>;
      export type CustomOption<T> = HangingProtocolTypes.CustomOption<T>;
      export type initialImageOptions = HangingProtocolTypes.initialImageOptions;
      export type ViewportOptions = HangingProtocolTypes.ViewportOptions;
      export type DisplaySetOptions = HangingProtocolTypes.DisplaySetOptions;
      export type Viewport = HangingProtocolTypes.Viewport;
      export type StageStatus = HangingProtocolTypes.StageStatus;
      export type StageActivation = HangingProtocolTypes.StageActivation;
      export type ProtocolStage = HangingProtocolTypes.ProtocolStage;
      export type ProtocolNotifications = HangingProtocolTypes.ProtocolNotifications;
      export type Protocol = HangingProtocolTypes.Protocol;
      export type ProtocolGenerator = HangingProtocolTypes.ProtocolGenerator;
      export type HPInfo = HangingProtocolTypes.HPInfo;
    }

    // IPubSub types
    export namespace PubSub {
      export type IPubSub = IPubSubTypes.default;
      export type Subscription = IPubSubTypes.Subscription;
    }

    // PanelModule types
    export namespace PanelModule {
      export type Panel = PanelModuleTypes.Panel;
      export type ActivatePanelTriggers = PanelModuleTypes.ActivatePanelTriggers;
      export type PanelEvent = PanelModuleTypes.PanelEvent;
      export type ActivatePanelEvent = PanelModuleTypes.ActivatePanelEvent;
    }

    // StudyMetadata types
    export namespace StudyMetadata {
      export type PatientMetadata = StudyMetadataTypes.PatientMetadata;
      export type StudyMetadata = StudyMetadataTypes.StudyMetadata;
      export type SeriesMetadata = StudyMetadataTypes.SeriesMetadata;
      export type InstanceMetadata = StudyMetadataTypes.InstanceMetadata;
    }

    // ViewportGrid types
    export namespace ViewportGrid {
      export type Viewport = ViewportGridTypes.GridViewport;
      export type Layout = ViewportGridTypes.Layout;
      export type State = ViewportGridTypes.ViewportGridState;
      export type Viewports = ViewportGridTypes.GridViewports;
      export type GridViewportOptions = ViewportGridTypes.GridViewportOptions;
    }
  }

  export interface PresentationIds {}

  export type withAppTypes<T = object> = T &
    AppTypes.Services &
    AppTypes.Managers & {
      [key: string]: unknown;
    } & AppTypes.Config;

  export type withTestTypes<T = object> = T & AppTypes.Test;
}
