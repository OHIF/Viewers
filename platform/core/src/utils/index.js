import { DICOMTagDescriptions } from './DICOMTagDescriptions';
import ObjectPath from './objectPath';
import StackManager from './StackManager.js';
import absoluteUrl from './absoluteUrl';
import addServers from './addServers';
import guid from './guid';
import sortBy from './sortBy.js';
import studyMetadataManager from './studyMetadataManager';
import updateMetaDataManager from './updateMetaDataManager.js';
import writeScript from './writeScript.js';
import DicomLoaderService from './dicomLoaderService.js';
import b64toBlob from './b64toBlob.js';
import * as urlUtil from './urlUtil';
import makeCancelable from './makeCancelable';
import hotkeys from './hotkeys';

const utils = {
  guid,
  ObjectPath,
  absoluteUrl,
  addServers,
  sortBy,
  writeScript,
  b64toBlob,
  StackManager,
  studyMetadataManager,
  // Updates WADO-RS metaDataManager
  updateMetaDataManager,
  DICOMTagDescriptions,
  DicomLoaderService,
  urlUtil,
  makeCancelable,
  hotkeys,
};

export {
  guid,
  ObjectPath,
  absoluteUrl,
  addServers,
  sortBy,
  writeScript,
  b64toBlob,
  StackManager,
  studyMetadataManager,
  // Updates WADO-RS metaDataManager
  updateMetaDataManager,
  DICOMTagDescriptions,
  DicomLoaderService,
  urlUtil,
  makeCancelable,
  hotkeys,
};

export default utils;
