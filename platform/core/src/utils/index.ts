import ObjectPath from './objectPath';
import absoluteUrl from './absoluteUrl';
import guid from './guid';
import uuidv4 from './uuidv4';
import sortBy from './sortBy.js';
import writeScript from './writeScript.js';
import b64toBlob from './b64toBlob.js';
//import loadAndCacheDerivedDisplaySets from './loadAndCacheDerivedDisplaySets.js';
import urlUtil from './urlUtil';
import makeDeferred from './makeDeferred';
import makeCancelable from './makeCancelable';
import hotkeys from './hotkeys';
import Queue from './Queue';
import isDicomUid from './isDicomUid';
import formatDate from './formatDate';
import formatTime from './formatTime';
import formatPN from './formatPN';
import generateAcceptHeader from './generateAcceptHeader';
import resolveObjectPath from './resolveObjectPath';
import hierarchicalListUtils from './hierarchicalListUtils';
import progressTrackingUtils from './progressTrackingUtils';
import isLowPriorityModality from './isLowPriorityModality';
import { isImage } from './isImage';
import isDisplaySetReconstructable from './isDisplaySetReconstructable';
import sortInstancesByPosition from './sortInstancesByPosition';
import imageIdToURI from './imageIdToURI';
import debounce from './debounce';
import roundNumber from './roundNumber';
import toNumber from './toNumber';
import downloadCSVReport from './downloadCSVReport';
import isEqualWithin from './isEqualWithin';
import addAccessors from './addAccessors';
import {
  sortStudy,
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria,
  seriesSortCriteria,
  instancesSortCriteria,
} from './sortStudy';
import { splitComma, getSplitParam } from './splitComma';
import { createStudyBrowserTabs } from './createStudyBrowserTabs';
import { sopClassDictionary } from './sopClassDictionary';
import * as MeasurementFilters from './measurementFilters';
import getClosestOrientationFromIOP from './getClosestOrientationFromIOP';
import calculateScanAxisNormal from './calculateScanAxisNormal';
import areAllImageOrientationsEqual from './areAllImageOrientationsEqual';
// Commented out unused functionality.
// Need to implement new mechanism for derived displaySets using the displaySetManager.

const utils = {
  guid,
  uuidv4,
  ObjectPath,
  absoluteUrl,
  sortBy,
  sortBySeriesDate: sortStudySeries,
  sortStudy,
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria,
  seriesSortCriteria,
  instancesSortCriteria,
  writeScript,
  formatDate,
  formatTime,
  formatPN,
  b64toBlob,
  urlUtil,
  imageIdToURI,
  //loadAndCacheDerivedDisplaySets,
  makeDeferred,
  makeCancelable,
  hotkeys,
  Queue,
  isDicomUid,
  isEqualWithin,
  sopClassDictionary,
  addAccessors,
  resolveObjectPath,
  hierarchicalListUtils,
  progressTrackingUtils,
  isLowPriorityModality,
  isImage,
  isDisplaySetReconstructable,
  debounce,
  roundNumber,
  toNumber,
  downloadCSVReport,
  splitComma,
  getSplitParam,
  generateAcceptHeader,
  createStudyBrowserTabs,
  MeasurementFilters,
  getClosestOrientationFromIOP,
  calculateScanAxisNormal,
  areAllImageOrientationsEqual,
};

export {
  guid,
  ObjectPath,
  absoluteUrl,
  sortBy,
  formatDate,
  writeScript,
  b64toBlob,
  urlUtil,
  //loadAndCacheDerivedDisplaySets,
  makeDeferred,
  makeCancelable,
  hotkeys,
  Queue,
  isDicomUid,
  isEqualWithin,
  resolveObjectPath,
  hierarchicalListUtils,
  progressTrackingUtils,
  isLowPriorityModality,
  isImage,
  isDisplaySetReconstructable,
  sortInstancesByPosition,
  imageIdToURI,
  debounce,
  roundNumber,
  toNumber,
  downloadCSVReport,
  splitComma,
  getSplitParam,
  generateAcceptHeader,
  createStudyBrowserTabs,
  MeasurementFilters,
  getClosestOrientationFromIOP,
};

export default utils;
