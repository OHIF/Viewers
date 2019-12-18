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
import utils from './utils/';

import {
  UINotificationService,
  UIModalService,
  UIDialogService,
} from './services';

const OHIF = {
  MODULE_TYPES,
  //
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  ServicesManager,
  //
  utils,
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
  UINotificationService,
  UIModalService,
  UIDialogService,
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
  UINotificationService,
  UIModalService,
  UIDialogService,
};

export { OHIF };

export default OHIF;
