import { ExtensionManager, MODULE_TYPES } from './extensions';
import { ServiceProvidersManager, ServicesManager } from './services';
import classes, { CommandsManager, HotkeysManager } from './classes';
import { SystemContextProvider, useSystem } from './contextProviders/SystemProvider';
import { ViewportRefsProvider } from './hooks/useViewportRef';

import DICOMWeb from './DICOMWeb';
import errorHandler from './errorHandler.js';
import log from './log.js';
import object from './object.js';
import string from './string.js';
import user from './user';
import utils from './utils';
import defaults from './defaults';
import * as Types from './types';
import * as Enums from './enums';
import {
  CineService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  //
  DicomMetadataStore,
  DisplaySetService,
  ToolbarService,
  MeasurementService,
  ViewportGridService,
  HangingProtocolService,
  pubSubServiceInterface,
  PubSubService,
  UserAuthenticationService,
  CustomizationService,
  PanelService,
  WorkflowStepsService,
  StudyPrefetcherService,
  MultiMonitorService,
} from './services';

import { DisplaySetMessage, DisplaySetMessageList } from './services/DisplaySetService';
import {
  createViewportGridStore,
  assembleLegacyState,
  selectLayout,
  selectActiveViewportId,
  selectViewport,
  selectIsActive,
  selectStability,
  shallowEqual,
} from './services/ViewportGridService';

import IWebApiDataSource from './DataSources/IWebApiDataSource';
import useActiveViewportDisplaySets from './hooks/useActiveViewportDisplaySets';

export * from './hooks';

const hotkeys = {
  ...utils.hotkeys,
  defaults: { hotkeyBindings: defaults.hotkeyBindings },
};

const OHIF = {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
  ServiceProvidersManager,
  //
  defaults,
  utils,
  hotkeys,
  classes,
  string,
  user,
  errorHandler,
  object,
  log,
  DICOMWeb,
  viewer: {},
  //
  CineService,
  CustomizationService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  MeasurementService,
  ToolbarService,
  ViewportGridService,
  HangingProtocolService,
  UserAuthenticationService,
  MultiMonitorService,
  IWebApiDataSource,
  DicomMetadataStore,
  pubSubServiceInterface,
  PubSubService,
  PanelService,
  useActiveViewportDisplaySets,
  WorkflowStepsService,
  StudyPrefetcherService,
};

export {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
  ServiceProvidersManager,
  SystemContextProvider,
  ViewportRefsProvider,
  //
  defaults,
  utils,
  hotkeys,
  classes,
  string,
  user,
  errorHandler,
  object,
  log,
  DICOMWeb,
  //
  CineService,
  CustomizationService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  DisplaySetMessage,
  DisplaySetMessageList,
  MeasurementService,
  MultiMonitorService,
  ToolbarService,
  ViewportGridService,
  createViewportGridStore,
  assembleLegacyState,
  selectLayout,
  selectActiveViewportId,
  selectViewport,
  selectIsActive,
  selectStability,
  shallowEqual,
  HangingProtocolService,
  UserAuthenticationService,
  IWebApiDataSource,
  DicomMetadataStore,
  pubSubServiceInterface,
  PubSubService,
  Enums,
  PanelService,
  WorkflowStepsService,
  StudyPrefetcherService,
  useSystem,
  useActiveViewportDisplaySets,
};

export { OHIF };

export type { Types };
export type { SortDisplaySetsCopyOptions } from './utils/sortStudy';
export type {
  ApplyLayoutProps,
  DerivedGridState,
  GetPresentationIds,
  GridLayout,
  LegacyViewportEntry,
  LegacyViewportGridState,
  PaneGeometry,
  SelectOptions,
  SetDisplaySetsUpdate,
  StabilityLevel,
  StabilitySelection,
  ViewportComposition,
  ViewportGridSnapshot,
  ViewportGridStore,
  ViewportGridStoreActions,
  ViewportGridStoreState,
  ViewportRuntimeEntry,
  ViewportRuntimePhase,
} from './services/ViewportGridService';

export default OHIF;
