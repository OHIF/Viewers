import { MODULE_TYPES, utils } from '@ohif/core';
import loadSegmentation from './loadSegmentation';

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
        metadata,
        isDerived: true,
        referencedDisplaySetUID: null, // Assigned when loaded.
        labelmapIndex: null, // Assigned when loaded.
        isLoaded: false,
        SeriesDate,
        SeriesTime,
        SeriesDescription,
      };

      segDisplaySet.load = function(referencedDisplaySet, studies) {
        return loadSegmentation(segDisplaySet, referencedDisplaySet, studies);
      };

      return segDisplaySet;
    },
  };
}
