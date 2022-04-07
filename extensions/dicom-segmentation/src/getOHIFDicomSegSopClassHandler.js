import { MODULE_TYPES, utils } from '@ohif/core';
import loadSegmentation from './loadSegmentation';
import getSourceDisplaySet from './getSourceDisplaySet';
import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';

const { DicomLoaderService } = OHIF.utils;
const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  DICOM_SEG: '1.2.840.10008.5.1.4.1.1.66.4',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

export default function getSopClassHandlerModule({ servicesManager }) {
  // TODO: Handle the case where there is more than one SOP Class Handler for the
  // same SOP Class.
  return {
    id: 'OHIFDicomSegSopClassHandler',
    type: MODULE_TYPES.SOP_CLASS_HANDLER,
    sopClassUIDs,
    getDisplaySetFromSeries: function(
      series,
      study,
      dicomWebClient,
      authorizationHeaders
    ) {
      const instance = series.getFirstInstance();
      const metadata = instance.getData().metadata;

      const {
        SeriesDate,
        SeriesTime,
        SeriesDescription,
        FrameOfReferenceUID,
        SOPInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
        SeriesNumber,
      } = metadata;

      const segDisplaySet = {
        Modality: 'SEG',
        displaySetInstanceUID: utils.guid(),
        wadoRoot: study.getData().wadoRoot,
        wadoUri: instance.getData().wadouri,
        SOPInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
        FrameOfReferenceUID,
        authorizationHeaders,
        isDerived: true,
        referencedDisplaySetUID: null, // Assigned when loaded.
        labelmapIndex: null, // Assigned when loaded.
        isLoaded: false,
        loadError: false,
        hasOverlapping: false,
        SeriesDate,
        SeriesTime,
        SeriesNumber,
        SeriesDescription,
        metadata,
      };

      segDisplaySet.getSourceDisplaySet = function(
        studies,
        activateLabelMap = true,
        onDisplaySetLoadFailureHandler
      ) {
        return getSourceDisplaySet(
          studies,
          segDisplaySet,
          activateLabelMap,
          onDisplaySetLoadFailureHandler
        );
      };

      segDisplaySet.load = async function(referencedDisplaySet, studies) {
        segDisplaySet.isLoaded = true;
        const { StudyInstanceUID } = referencedDisplaySet;
        const segArrayBuffer = await DicomLoaderService.findDicomDataPromise(
          segDisplaySet,
          studies
        );
        const dicomData = DicomMessage.readFile(segArrayBuffer);
        const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
        dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
        const imageIds = _getImageIdsForDisplaySet(
          studies,
          StudyInstanceUID,
          referencedDisplaySet.SeriesInstanceUID
        );

        const results = await _parseSeg(segArrayBuffer, imageIds);
        if (results === undefined) {
          return;
        }
        const {
          labelmapBufferArray,
          segMetadata,
          segmentsOnFrame,
          segmentsOnFrameArray,
        } = results;
        let labelmapIndex;
        if (labelmapBufferArray.length > 1) {
          let labelmapIndexes = [];
          for (let i = 0; i < labelmapBufferArray.length; ++i) {
            segMetadata.segmentationSeriesInstanceUID =
              segDisplaySet.SeriesInstanceUID;
            segMetadata.hasOverlapping = true;
            labelmapIndexes.push(
              await loadSegmentation(
                imageIds,
                segDisplaySet,
                labelmapBufferArray[i],
                segMetadata,
                segmentsOnFrame,
                segmentsOnFrameArray[i]
              )
            );
          }
          /**
           * Since overlapping segments have virtual labelmaps,
           * originLabelMapIndex is used in the panel to select the correct dropdown value.
           */
          segDisplaySet.hasOverlapping = true;
          segDisplaySet.originLabelMapIndex = labelmapIndexes[0];
          labelmapIndex = labelmapIndexes[0];
          console.warn('Overlapping segments!');
        } else {
          segMetadata.segmentationSeriesInstanceUID =
            segDisplaySet.SeriesInstanceUID;
          segMetadata.hasOverlapping = false;
          labelmapIndex = await loadSegmentation(
            imageIds,
            segDisplaySet,
            labelmapBufferArray[0],
            segMetadata,
            segmentsOnFrame,
            []
          );
        }
      };

      return segDisplaySet;
    },
  };
}

function _parseSeg(arrayBuffer, imageIds) {
  const skipOverlapping = false;
  const tolerance = 1e-2;
  const cornerstoneToolsVersion = 4;
  return dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
    imageIds,
    arrayBuffer,
    cornerstone.metaData,
    skipOverlapping,
    tolerance,
    cornerstoneToolsVersion
  );
}

function _getImageIdsForDisplaySet(
  studies,
  StudyInstanceUID,
  SeriesInstanceUID
) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  const displaySets = study.displaySets.filter(displaySet => {
    return displaySet.SeriesInstanceUID === SeriesInstanceUID;
  });

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same SeriesInstanceUID. This is not supported yet...'
    );
    // TODO -> We could make check the instance list and see if any match?
    // Do we split the segmentation into two cornerstoneTools segmentations if there are images in both series?
    // ^ Will that even happen?
  }

  const referencedDisplaySet = displaySets[0];

  return referencedDisplaySet.images.map(image => image.getImageId());
}
