import * as cornerstoneTools from '@cornerstonejs/tools';
import fetchJSON from './fetchJSON';
import showNotification from '../../components/common/showNotification';
import fetchXML from './fetchXML';
import fetchArrayBuffer from './fetchArrayBuffer';
import RoiImporter from './classes/RoiImporter';
import LazyRoiImporter from './classes/LazyRoiImporter';

const triggerEvent = cornerstoneTools.importInternal('util/triggerEvent');

const noop = () => {};

/**
 * async _getAndImportFile - Imports the file from the REST url and loads it into
 *                           cornerstoneTools toolData.
 *
 * @param  {string} uri                 The REST URI of the file.
 * @param  {Object} roiCollectionInfo  An object describing the roiCollection to
 *                                    import.
 * @param callbacks
 * @returns {null}
 */
const getAndImportContourFile = async (
  uri,
  roiCollectionInfo,
  callbacks = {}
) => {
  // The URIs fetched have an additional /, so remove it.
  uri = uri.slice(1);
  let errorMessage = '';

  const updateProgress = callbacks.updateProgress || noop;

  // Get contour loading preferences
  const preferences = window.store.getState().preferences;
  const ContourROILazyLoading =
    preferences.experimentalFeatures.ContourROILazyLoading;
  const lazyLoadingEnabled =
    !!ContourROILazyLoading && ContourROILazyLoading.enabled;

  let roiImporter;
  if (lazyLoadingEnabled) {
    roiImporter = new LazyRoiImporter(
      roiCollectionInfo.referencedSeriesInstanceUid,
      updateProgress
    );
  } else {
    roiImporter = new RoiImporter(
      roiCollectionInfo.referencedSeriesInstanceUid,
      updateProgress
    );
  }

  switch (roiCollectionInfo.collectionType) {
    case 'AIM':
      const aimFile = await fetchXML(uri, updateProgress).promise;

      if (!aimFile) {
        errorMessage = `Invalid AIM file for Collection ${roiCollectionInfo.name}`;
        break;
      }

      await roiImporter.importAIMfile(
        aimFile,
        roiCollectionInfo.name,
        roiCollectionInfo.label
      );
      break;
    case 'RTSTRUCT':
      const rtStructFile = await fetchArrayBuffer(uri, updateProgress).promise;

      if (!rtStructFile) {
        errorMessage = `Invalid RTStruct file for Collection ${roiCollectionInfo.name}`;
        break;
      }

      await roiImporter.importRTStruct(
        rtStructFile,
        roiCollectionInfo.name,
        roiCollectionInfo.label
      );
      break;
    default:
      console.error(
        `Collection ${roiCollectionInfo.name} has unsupported filetype: ${roiCollectionInfo.collectionType}.`
      );
      errorMessage = `Collection ${roiCollectionInfo.name} has unsupported filetype: ${roiCollectionInfo.collectionType}.`;
  }

  return errorMessage;
};

/**
 * async importContourRoiCollection - Fetch and import the ROI collection from XNAT.
 *
 * @param  {Object} roiCollectionInfo The collection info for the ROI Collection.
 * @param callbacks
 * @returns {null}
 */
const importContourRoiCollection = async (
  roiCollectionInfo,
  callbacks = {}
) => {
  const roiList = await fetchJSON(roiCollectionInfo.getFilesUri).promise;
  const result = roiList.ResultSet.Result;

  // No associated file is found (nothing to import, badly deleted roiCollection).
  if (result.length === 0) {
    showNotification(
      `No associated files were found for collection ${roiCollectionInfo.name}`,
      'warning',
      'Contours Import'
    );
    return;
  }

  // Retrieve each ROI from the list that has the same collectionType as the collection.
  // In an ideal world this should always be 1, and any other resources -- if any -- are differently formatted representations of the same data, but things happen.
  // ToDo: revisit this logic of importing multiple data sources
  for (let i = 0; i < result.length; i++) {
    const fileType = result[i].collection;
    if (fileType === roiCollectionInfo.collectionType) {
      const errorMessage = await getAndImportContourFile(
        result[i].URI,
        roiCollectionInfo,
        callbacks
      );
      if (errorMessage) {
        showNotification(errorMessage, 'error', 'Contours Import');
      } else {
        showNotification(
          `Contours collection ${roiCollectionInfo.name} imported successfully`,
          'success',
          'Contours Import'
        );
      }
    }
  }
};

const importContourRoiCollections = async (
  collectionsToParse,
  callbacks = {},
  updateContoursPanel = false
) => {
  let numCollectionsParsed = 0;
  let numCollectionsToParse = collectionsToParse.length;

  for (let i = 0; i < collectionsToParse.length; i++) {
    if (callbacks.updateImportingText) {
      const importingText = [
        `Collection: ${numCollectionsParsed + 1}/${numCollectionsToParse}`,
        `${collectionsToParse[i].name}`,
      ];
      callbacks.updateImportingText(importingText);
    }
    if (callbacks.updateProgress) {
      callbacks.updateProgress('');
    }
    await importContourRoiCollection(collectionsToParse[i], callbacks);
    numCollectionsParsed++;
  }

  if (updateContoursPanel) {
    triggerEvent(document, 'finishedcontourimportusingmodalevent', {});
  }

  if (callbacks.onImportComplete) {
    callbacks.onImportComplete();
  }
};

export default importContourRoiCollections;
