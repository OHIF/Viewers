import './lib';

import { ExtensionManager, MODULE_TYPES } from './extensions';
import { ServicesManager } from './services';
import classes, { CommandsManager, HotkeysManager } from './classes/';

import DICOMWeb from './DICOMWeb';
import DICOMSR from './DICOMSR';
import cornerstone from './cornerstone.js';
import errorHandler from './errorHandler.js';
import hangingProtocols from './hanging-protocols';
import header from './header.js';
import log from './log.js';
import measurements from './measurements';
import metadata from './classes/metadata/';
import object from './object.js';
import redux from './redux/';
import string from './string.js';
import studies from './studies/';
import ui from './ui';
import user from './user.js';
import { ViewModelProvider, useViewModel } from './ViewModelContext';
import utils from './utils/';
import defaults from './defaults';

import {
  CineService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  //
  DicomMetadataStore,
  DisplaySetService,
  ToolBarSerivce, // TODO: Typo
  MeasurementService,
  ViewportGridService,
  HangingProtocolService,
} from './services';

import IWebApiDataSource from './DataSources/IWebApiDataSource';

const hotkeys = {
  ...utils.hotkeys,
  defaults: { hotkeyBindings: defaults.hotkeyBindings }
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
  studies,
  redux,
  classes,
  metadata,
  header,
  cornerstone,
  string,
  ui,
  user,
  errorHandler,
  object,
  log,
  DICOMWeb,
  DICOMSR,
  viewer: {},
  measurements,
  hangingProtocols,
  //
  CineService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  MeasurementService,
  ToolBarSerivce, // TODO: TYPO
  ViewportGridService,
  HangingProtocolService,
  IWebApiDataSource,
  DicomMetadataStore,
  //
  ViewModelProvider,
  useViewModel,
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
  studies,
  redux,
  classes,
  metadata,
  header,
  cornerstone,
  string,
  ui,
  user,
  errorHandler,
  object,
  log,
  DICOMWeb,
  DICOMSR,
  measurements,
  hangingProtocols,
  //
  CineService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  DisplaySetService,
  MeasurementService,
  ToolBarSerivce,
  ViewportGridService,
  HangingProtocolService,
  IWebApiDataSource,
  DicomMetadataStore,
  ViewModelProvider,
  useViewModel,
};

export { OHIF };

export default OHIF;
