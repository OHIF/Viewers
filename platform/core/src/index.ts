import { ExtensionManager, MODULE_TYPES } from './extensions';
import { ServicesManager } from './services';
import classes, { CommandsManager, HotkeysManager } from './classes';

import DICOMWeb from './DICOMWeb';
import errorHandler from './errorHandler.js';
import log from './log.js';
import object from './object.js';
import string from './string.js';
import user from './user.js';
import utils from './utils';
import defaults from './defaults';
import * as Types from './types';

import {
  CineService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  //
  DicomMetadataStore,
  DisplaySetService,
  DisplaySetServiceRegistration,
  ToolbarService,
  ToolbarServiceRegistration,
  MeasurementService,
  MeasurementServiceRegistration,
  ViewportGridService,
  ViewportGridServiceRegistration,
  HangingProtocolService,
  HangingProtocolServiceRegistration,
  pubSubServiceInterface,
  PubSubService,
  UserAuthenticationService,
  CustomizationService,
  CustomizationServiceRegistration,
  Services,
} from './services';

import IWebApiDataSource from './DataSources/IWebApiDataSource';

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
  CustomizationServiceRegistration,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  DisplaySetServiceRegistration,
  MeasurementService,
  MeasurementServiceRegistration,
  ToolbarService,
  ToolbarServiceRegistration,
  ViewportGridService,
  ViewportGridServiceRegistration,
  HangingProtocolService,
  HangingProtocolServiceRegistration,
  UserAuthenticationService,
  IWebApiDataSource,
  DicomMetadataStore,
  pubSubServiceInterface,
  PubSubService,
};

export {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
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
  CustomizationServiceRegistration,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  DisplaySetServiceRegistration,
  MeasurementService,
  MeasurementServiceRegistration,
  ToolbarService,
  ToolbarServiceRegistration,
  ViewportGridService,
  ViewportGridServiceRegistration,
  HangingProtocolService,
  HangingProtocolServiceRegistration,
  UserAuthenticationService,
  IWebApiDataSource,
  DicomMetadataStore,
  pubSubServiceInterface,
  PubSubService,
  Types,
  Services,
};

export { OHIF };

export default OHIF;
