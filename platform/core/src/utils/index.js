import ObjectPath from './objectPath';
import StackManager from './StackManager.js';
import absoluteUrl from './absoluteUrl';
import guid from './guid';
import sortBy from './sortBy.js';
import sortBySeriesDate from './sortBySeriesDate.js';
import writeScript from './writeScript.js';
import DicomLoaderService from './dicomLoaderService.js';
import b64toBlob from './b64toBlob.js';
//import loadAndCacheDerivedDisplaySets from './loadAndCacheDerivedDisplaySets.js';
import urlUtil from './urlUtil';
import makeDeferred from './makeDeferred';
import makeCancelable from './makeCancelable';
import hotkeys from './hotkeys';
import Queue from './Queue';
import isDicomUid from './isDicomUid';
import formatDate from './formatDate';
import formatPN from './formatPN';
import resolveObjectPath from './resolveObjectPath';
import hierarchicalListUtils from './hierarchicalListUtils';
import progressTrackingUtils from './progressTrackingUtils';
import isLowPriorityModality from './isLowPriorityModality';

// Commented out unused functionality.
// Need to implement new mechanism for dervived displaySets using the displaySetManager.

const utils = {
  guid,
  ObjectPath,
  absoluteUrl,
  sortBy,
  sortBySeriesDate,
  writeScript,
  formatDate,
  formatPN,
  b64toBlob,
  StackManager,
  DicomLoaderService,
  urlUtil,
  //loadAndCacheDerivedDisplaySets,
  makeDeferred,
  makeCancelable,
  hotkeys,
  Queue,
  isDicomUid,
  resolveObjectPath,
  hierarchicalListUtils,
  progressTrackingUtils,
  isLowPriorityModality
};

export {
  guid,
  ObjectPath,
  absoluteUrl,
  sortBy,
  formatDate,
  writeScript,
  b64toBlob,
  StackManager,
  DicomLoaderService,
  urlUtil,
  //loadAndCacheDerivedDisplaySets,
  makeDeferred,
  makeCancelable,
  hotkeys,
  Queue,
  isDicomUid,
  resolveObjectPath,
  hierarchicalListUtils,
  progressTrackingUtils,
  isLowPriorityModality
};

export default utils;
