import './lib';

import { ExtensionManager, MODULE_TYPES } from './extensions';
import { ServicesManager } from './services';
import classes, { CommandsManager, HotkeysManager } from './classes/';

import DICOMWeb from './DICOMWeb';
import DICOMSR from './DICOMSR';
import cornerstone from './cornerstone.js';
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
import dicomMetadataStore from './dicomMetadataStore';
import displaySetManager from './displaySetManager';
import ToolBarManager from './ToolBarManager';
import utils, { hotkeys } from './utils/';

import {
  MeasurementService,
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
} from './services';

import IWebApiDataSource from './DataSources/IWebApiDataSource';

const OHIF = {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
  //
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
  object,
  log,
  DICOMWeb,
  DICOMSR,
  viewer: {},
  measurements,
  hangingProtocols,
  //
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  MeasurementService,
  IWebApiDataSource,
  dicomMetadataStore,
  displaySetManager,
  ToolBarManager,
};

export {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
  //
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
  object,
  log,
  DICOMWeb,
  DICOMSR,
  measurements,
  hangingProtocols,
  //
  UIDialogService,
  UIModalService,
  UINotificationService,
  UIViewportDialogService,
  MeasurementService,
  IWebApiDataSource,
  dicomMetadataStore,
  displaySetManager,
  ToolBarManager,
};

export { OHIF };

export default OHIF;
