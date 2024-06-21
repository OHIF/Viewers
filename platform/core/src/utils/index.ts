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
import downloadCSVReport from './downloadCSVReport';
import isEqualWithin from './isEqualWithin';
import addAccessors from './addAccessors';
import {
  sortStudy,
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria,
  seriesSortCriteria,
} from './sortStudy';
import { subscribeToNextViewportGridChange } from './subscribeToNextViewportGridChange';
import { splitComma, getSplitParam } from './splitComma';
import { createStudyBrowserTabs } from './createStudyBrowserTabs';

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
  writeScript,
  formatDate,
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
  addAccessors,
  resolveObjectPath,
  hierarchicalListUtils,
  progressTrackingUtils,
  isLowPriorityModality,
  isImage,
  isDisplaySetReconstructable,
  debounce,
  roundNumber,
  downloadCSVReport,
  subscribeToNextViewportGridChange,
  splitComma,
  getSplitParam,
  generateAcceptHeader,
  createStudyBrowserTabs,
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
  downloadCSVReport,
  splitComma,
  getSplitParam,
  generateAcceptHeader,
  createStudyBrowserTabs,
};

export default utils;
