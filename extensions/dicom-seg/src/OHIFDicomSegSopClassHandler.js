import { MODULE_TYPES, utils, DICOMWeb } from '@ohif/core';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  DICOM_SEG: '1.2.840.10008.5.1.4.1.1.66.4',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

// TODO: Handle the case where there is more than one SOP Class Handler for the
// same SOP Class.
const OHIFDicomSegSopClassHandler = {
  id: 'OHIFDicomSegSopClassHandler',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUids,
  getDisplaySetFromSeries: function(
    series,
    study,
    dicomWebClient,
    authorizationHeaders
  ) {
    const instance = series.getFirstInstance();
    const referencedSeriesSequence = instance.getTagValue(
      'ReferencedSeriesSequence'
    );
    const frameOfReferenceUID = instance.getTagValue('FrameOfReferenceUID');

    debugger;

    const { seriesDate, seriesTime } = series.getData();

    const displaySet = {
      plugin: 'seg',
      modality: 'SEG',
      displaySetInstanceUid: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID(),
      referencedSeriesSequence,
      frameOfReferenceUID,
      authorizationHeaders,
      isDerived: true,
      referencedDisplaySetUid: null, // Assigned when loaded.
      labelmapIndex: null, // Assigned when loaded.
      isLoaded: false,
      seriesDate,
      seriesTime,
    };

    displaySet.load = function(referencedDisplaySet, studies) {
      loadSegmentationIntoCornerstoneTools(
        displaySet,
        referencedDisplaySet,
        studies
      );
    };

    return displaySet;
  },
};

async function loadSegmentationIntoCornerstoneTools(
  segDisplaySet,
  referencedDisplaySet,
  studies
) {
  console.log(segDisplaySet, referencedDisplaySet, studies);
  debugger;

  // TODO -> Seg loading logic.
}

export default OHIFDicomSegSopClassHandler;
