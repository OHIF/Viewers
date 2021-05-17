import { MODULE_TYPES, utils, DICOMWeb } from '@ohif/core';
import loadRTStruct from './loadRTStruct';
import getSourceDisplaySet from './getSourceDisplaySet';

import id from './id';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  DICOM_RT_STRUCT: '1.2.840.10008.5.1.4.1.1.481.3',
};

const sopClassUIDs = Object.values(SOP_CLASS_UIDS);

const OHIFDicomRTStructSopClassHandler = {
  id: 'OHIFDicomRTStructSopClassHandler',
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
      SeriesNumber,
      SeriesDescription,
      FrameOfReferenceUID,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = metadata;

    // TODO -> GET REFERENCED FRAME OF REFERENCE SEQUENCE.

    const rtStructDisplaySet = {
      Modality: 'RTSTRUCT',
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
      SeriesNumber,
      SeriesDescription,
      metadata,
    };

    if (!metadata.ReferencedSeriesSequence) {
      const ReferencedFrameOfReferenceSequence =
        metadata.ReferencedFrameOfReferenceSequence;

      if (ReferencedFrameOfReferenceSequence) {
        // TODO -> @dannyrb Do we augment metadata or add a (potentially large? fallback list in filterDerivedDisplaySets )
        metadata.ReferencedSeriesSequence = _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
          ReferencedFrameOfReferenceSequence
        );
      }
    }

    rtStructDisplaySet.getSourceDisplaySet = function (studies, activateLabelMap = true) {
      return getSourceDisplaySet(studies, rtStructDisplaySet, activateLabelMap);
    };

    rtStructDisplaySet.load = function (referencedDisplaySet, studies) {
      return loadRTStruct(
        rtStructDisplaySet,
        referencedDisplaySet,
        studies
      ).catch(error => {
        rtStructDisplaySet.isLoaded = false;
        rtStructDisplaySet.loadError = true;
        throw new Error(error);
      });
    };

    return rtStructDisplaySet;
  },
};

function _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
  ReferencedFrameOfReferenceSequence
) {
  const ReferencedSeriesSequence = [];

  _getSequenceAsArray(ReferencedFrameOfReferenceSequence).forEach(
    referencedFrameOfReference => {
      const { RTReferencedStudySequence } = referencedFrameOfReference;

      _getSequenceAsArray(RTReferencedStudySequence).forEach(
        rtReferencedStudy => {
          const { RTReferencedSeriesSequence } = rtReferencedStudy;

          _getSequenceAsArray(RTReferencedSeriesSequence).forEach(
            rtReferencedSeries => {
              const ReferencedInstanceSequence = [];
              const {
                ContourImageSequence,
                SeriesInstanceUID,
              } = rtReferencedSeries;

              _getSequenceAsArray(ContourImageSequence).forEach(
                contourImage => {
                  ReferencedInstanceSequence.push({
                    ReferencedSOPInstanceUID:
                      contourImage.ReferencedSOPInstanceUID,
                    ReferencedSOPClassUID: contourImage.ReferencedSOPClassUID,
                  });
                }
              );

              const referencedSeries = {
                SeriesInstanceUID,
                ReferencedInstanceSequence,
              };

              ReferencedSeriesSequence.push(referencedSeries);
            }
          );
        }
      );
    }
  );

  return ReferencedSeriesSequence;
}

function _getSequenceAsArray(sequence) {
  return Array.isArray(sequence) ? sequence : [sequence];
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
