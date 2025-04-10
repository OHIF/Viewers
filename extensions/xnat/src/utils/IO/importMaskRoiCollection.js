import * as cornerstoneTools from '@cornerstonejs/tools';
import MaskImporter from './classes/MaskImporter';
import fetchArrayBuffer from './fetchArrayBuffer';
import getFirstImageIdFromSeriesInstanceUid from './helpers/getFirstImageIdFromSeriesInstanceUid';
import fetchJSON from './fetchJSON';
import showNotification from '../../components/common/showNotification';

const segmentationModule = cornerstoneTools.getModule('segmentation');
const triggerEvent = cornerstoneTools.importInternal('util/triggerEvent');

const noop = () => {};

/**
 * async getAndImportMaskFile - Imports the file from the REST url and loads it into
 *                              cornerstoneTools toolData.
 *
 * @param  {string} uri             The REST URI of the file.
 * @param  {object} segmentation    An object describing the roiCollection to
 *                                  import.
 * @param callbacks                 Object defining callbacks
 * @returns {null}
 */
const getAndImportMaskFile = async (uri, segmentation, callbacks = {}) => {
  // The URIs fetched have an additional /, so remove it.
  uri = uri.slice(1);
  let errorMessage = '';

  const updateProgress = callbacks.updateProgress || noop;

  const seriesInstanceUid = segmentation.referencedSeriesInstanceUid;
  const maskImporter = new MaskImporter(seriesInstanceUid, updateProgress);

  const firstImageId = getFirstImageIdFromSeriesInstanceUid(seriesInstanceUid);

  switch (segmentation.collectionType) {
    case 'SEG':
      if (callbacks.updateImportingText) {
        callbacks.updateImportingText(segmentation.name);
      }

      // Store that we've imported a collection for this series.
      segmentationModule.setters.importMetadata(firstImageId, {
        label: segmentation.label,
        type: 'SEG',
        name: segmentation.name,
        modified: false,
      });

      try {
        const segArrayBuffer = await fetchArrayBuffer(uri).promise;
        await maskImporter.importDICOMSEG(segArrayBuffer);
      } catch (e) {
        errorMessage = e.message || 'Unknown error';
      }

      break;

    case 'NIFTI':
      if (callbacks.updateImportingText) {
        callbacks.updateImportingText(segmentation.name);
      }

      // Store that we've imported a collection for this series.
      segmentationModule.setters.importMetadata(firstImageId, {
        label: segmentation.label,
        type: 'NIFTI',
        name: segmentation.name,
        modified: false,
      });

      const niftiArrayBuffer = await fetchArrayBuffer(uri).promise;

      maskImporter.importNIFTI(niftiArrayBuffer);

      break;

    default:
      console.error(
        `MaskImportListDialog._getAndImportFile not configured for filetype: ${segmentation.collectionType}.`
      );
      errorMessage = `MaskImportListDialog._getAndImportFile not configured for filetype: ${segmentation.collectionType}`;
  }

  if (errorMessage) {
    showNotification(errorMessage, 'error', 'Mask Import');
  } else {
    showNotification(
      `Mask collection <${segmentation.name}> imported successfully`,
      'success',
      'Mask Import'
    );
  }

  if (callbacks.onImportComplete) {
    callbacks.onImportComplete();
  }
};

/**
 * async importMaskRoiCollection - Imports a segmentation.
 *
 * @param  {Object} segmentation The segmentation JSON catalog fetched from XNAT.
 * @param callbacks
 * @param updateMasksPanel
 * @returns {null}  Object defining callbacks
 */
const importMaskRoiCollection = async (
  segmentation,
  callbacks = {},
  updateMasksPanel = false
) => {
  const roiList = await fetchJSON(segmentation.getFilesUri).promise;
  const result = roiList.ResultSet.Result;

  // No associated file is found (nothing to import, badly deleted roiCollection).
  if (result.length === 0) {
    showNotification(
      'No associated files were found for this collection to import.',
      'warning',
      'Mask Import'
    );
    if (callbacks.onImportComplete) {
      callbacks.onImportComplete();
    }
    return;
  }

  // Retrieve each ROI from the list that has the same collectionType as the collection.
  // In an ideal world this should always be 1, and any other resources -- if any -- are differently formatted representations of the same data, but things happen.
  // ToDo: revisit this logic of importing multiple data sources
  for (let i = 0; i < result.length; i++) {
    const fileType = result[i].collection;
    if (fileType === segmentation.collectionType) {
      await getAndImportMaskFile(result[i].URI, segmentation, callbacks);
    }
  }

  if (updateMasksPanel) {
    triggerEvent(document, 'finishedmaskimportusingmodalevent', {});
  }
};

export default importMaskRoiCollection;
