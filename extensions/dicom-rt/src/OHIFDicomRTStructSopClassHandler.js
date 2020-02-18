import { MODULE_TYPES, utils, DICOMWeb } from '@ohif/core';
import loadRTStruct from './loadRTStruct';

import id from './id';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  DICOM_RT_STRUCT: '1.2.840.10008.5.1.4.1.1.481.3',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

const OHIFDicomRTStructSopClassHandler = {
  id: 'OHIFDicomRTStructSopClassHandler',
  type: MODULE_TYPES.SOP_CLASS_HANDLER,
  sopClassUids,
  getDisplaySetFromSeries: function(
    series,
    study,
    dicomWebClient,
    authorizationHeaders
  ) {
    const instance = series.getFirstInstance();
    const instanceData = instance.getData();

    const frameOfReferenceUID = instance.getTagValue('FrameOfReferenceUID');
    const { seriesDate, seriesTime, seriesDescription } = series.getData();

    // TODO -> GET REFERENCED FRAME OF REFERENCE SEQUENCE.

    const rtStructDisplaySet = {
      plugin: id,
      modality: 'RTSTRUCT',
      displaySetInstanceUid: utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID(),
      frameOfReferenceUID,
      authorizationHeaders,
      isDerived: true,
      referencedDisplaySetUid: null, // Assigned when loaded.
      labelmapIndex: null, // Assigned when loaded.
      isLoaded: false,
      seriesDate,
      seriesTime,
      seriesDescription,
    };

    const referencedSeriesSequence = instance.getTagValue(
      'ReferencedSeriesSequence'
    );

    if (referencedSeriesSequence) {
      rtStructDisplaySet.referencedSeriesSequence = referencedSeriesSequence;
    } else {
      const referencedFrameOfReferenceSequence = _getReferencedFrameOfReferenceSequence(
        instanceData._instanceRaw
      );

      if (referencedFrameOfReferenceSequence) {
        rtStructDisplaySet.referencedSeriesSequence = _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
          referencedFrameOfReferenceSequence
        );
      }
    }

    rtStructDisplaySet.load = function(referencedDisplaySet, studies) {
      return loadRTStruct(
        rtStructDisplaySet,
        referencedDisplaySet,
        studies
      ).catch(error => {
        rtStructDisplaySet.isLoaded = false;
        throw new Error(error);
      });
    };

    return rtStructDisplaySet;
  },
};

function _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
  referencedFrameOfReferenceSequence
) {
  const referencedSeriesSequence = [];

  referencedFrameOfReferenceSequence.forEach(referencedFrameOfReference => {
    const { rtReferencedStudySequence } = referencedFrameOfReference;

    rtReferencedStudySequence.forEach(rtReferencedStudy => {
      const { rtReferencedSeriesSequence } = rtReferencedStudy;

      rtReferencedSeriesSequence.forEach(rtReferencedSeries => {
        const referencedInstanceSequence = [];
        const { contourImageSequence, seriesInstanceUID } = rtReferencedSeries;

        contourImageSequence.forEach(contourImage => {
          referencedInstanceSequence.push({
            referencedSOPInstanceUID: contourImage.referencedSOPInstanceUID,
            referencedSOPClassUID: contourImage.referencedSOPClassUID,
          });
        });

        const referencedSeries = {
          referencedSeriesInstanceUID: seriesInstanceUID,
          referencedInstanceSequence,
        };

        referencedSeriesSequence.push(referencedSeries);
      });
    });
  });

  return referencedSeriesSequence;
}

function _getReferencedFrameOfReferenceSequence(instance) {
  const referencedFrameOfReferenceSequenceRaw = instance['30060010'];

  const referencedFrameOfReferenceSequence = [];

  if (
    !referencedFrameOfReferenceSequenceRaw ||
    !referencedFrameOfReferenceSequenceRaw.Value
  ) {
    return undefined;
  }

  referencedFrameOfReferenceSequenceRaw.Value.forEach(
    referencedFrameOfReferenceRaw => {
      const frameOfReferenceUID = DICOMWeb.getString(
        referencedFrameOfReferenceRaw['00200052']
      );

      const referencedFrameOfReference = { frameOfReferenceUID };
      const RTReferencedStudySequenceRaw =
        referencedFrameOfReferenceRaw['30060012'];

      referencedFrameOfReferenceSequence.push(referencedFrameOfReference);

      if (RTReferencedStudySequenceRaw && RTReferencedStudySequenceRaw.Value) {
        referencedFrameOfReference.rtReferencedStudySequence = [];

        const { rtReferencedStudySequence } = referencedFrameOfReference;

        RTReferencedStudySequenceRaw.Value.forEach(rtReferencedStudyRaw => {
          const referencedSopClassUID = DICOMWeb.getString(
            rtReferencedStudyRaw['00081150']
          );

          const referencedSOPInstanceUID = DICOMWeb.getString(
            rtReferencedStudyRaw['00081155']
          );

          const rtReferencedStudy = {
            referencedSopClassUID,
            referencedSOPInstanceUID,
            rtReferencedSeriesSequence: [],
          };

          rtReferencedStudySequence.push(rtReferencedStudy);

          const { rtReferencedSeriesSequence } = rtReferencedStudy;

          const rtReferencedSeriesSequenceRaw =
            rtReferencedStudyRaw['30060014'];

          rtReferencedSeriesSequenceRaw.Value.forEach(rtReferencedSeriesRaw => {
            const seriesInstanceUID = DICOMWeb.getString(
              rtReferencedSeriesRaw['0020000E']
            );

            const rtReferencedSeries = {
              seriesInstanceUID,
              contourImageSequence: [],
            };

            rtReferencedSeriesSequence.push(rtReferencedSeries);

            const { contourImageSequence } = rtReferencedSeries;

            const contourImageSequenceRaw = rtReferencedSeriesRaw['30060016'];

            contourImageSequenceRaw.Value.forEach(contourImageRaw => {
              const referencedSOPClassUID = DICOMWeb.getString(
                contourImageRaw['00081150']
              );

              const referencedSOPInstanceUID = DICOMWeb.getString(
                contourImageRaw['00081155']
              );

              const referencedFrameNumber = DICOMWeb.getString(
                contourImageRaw['00081160']
              );
              const referencedSegmentNumber = DICOMWeb.getString(
                contourImageRaw['0062000B']
              );

              const contourImage = {
                referencedSOPClassUID,
                referencedSOPInstanceUID,
                referencedFrameNumber,
                referencedSegmentNumber,
              };

              contourImageSequence.push(contourImage);
            });
          });
        });
      }
    }
  );

  return referencedFrameOfReferenceSequence;
}

export default OHIFDicomRTStructSopClassHandler;
