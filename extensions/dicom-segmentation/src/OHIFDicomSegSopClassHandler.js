import { MODULE_TYPES, utils } from '@ohif/core';
import loadSegmentation from './loadSegmentation';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  DICOM_SEG: '1.2.840.10008.5.1.4.1.1.66.4',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

// TODO: Handle the case where there is more than one SOP Class Handler for the
// same SOP Class.
const OHIFDicomSegSopClassHandler = {
  id: 'OHIFDicomSegSopClassHandler',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUIDs,
  getDisplaySetFromSeries: function (
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

    segDisplaySet.load = function (referencedDisplaySet, studies) {
      return loadSegmentation(
        segDisplaySet,
        referencedDisplaySet,
        studies
      ).then(() => {
        /*
         * TODO: Improve the way we notify parts of the app that depends on segs to be loaded.
         *
         * Currently we are using a non-ideal implementation through a custom event to notify the segmentation panel
         * or other components that could rely on loaded segmentations that
         * the segments were loaded so that e.g. when the user opens the panel
         * before the segments are fully loaded, the panel can subscribe to this custom event
         * and update itself with the new segments.
         *
         * This limitation is due to the fact that the cs segmentation module is an object (which will be
         * updated after the segments are loaded) that React its not aware of its changes
         * because the module object its not passed in to the panel component as prop but accessed externally.
         *
         * Improving this event approach to something reactive that can be tracked inside the react lifecycle,
         * allows us to easily watch the module or the segmentations loading process in any other component
         * without subscribing to external events.
         */
        console.log('Segmentation loaded.');
        const event = new CustomEvent('extensiondicomsegmentationsegloaded');
        document.dispatchEvent(event);
      }).catch(error => {
        segDisplaySet.isLoaded = false;
        throw new Error(error);
      });
    };

    return segDisplaySet;
  },
};

export default OHIFDicomSegSopClassHandler;
