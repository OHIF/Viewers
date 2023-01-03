import SegmentationToROIContour from './contours/SegmentationToROIContour';
import dcmjs from 'dcmjs';
import { DicomMetadataStore } from '@ohif/core';

const { DicomMetaDictionary } = dcmjs.data;

export default class RTSS {
  constructor() {}

  /**
   * Convert handles to RTSS report containing the dcmjs dicom dataset.
   *
   * Note: current WIP and using segmentations to contour conversion,
   * routine that is not fully tested
   *
   * @param annotations Array of Cornerstone tool annotation data
   * @param metadataProvider Metadata provider
   * @param options report generation options
   * @returns Report object containing the dataset
   */
  static async generateRTSS(segmentations, metadataProvider, options) {
    const roiContours = await SegmentationToROIContour.convert(
      segmentations,
      metadataProvider
    );
    console.log(roiContours);
    let dataset = initializeDataset(roiContours[0].metadata, metadataProvider);

    roiContours.forEach((contour, index) => {
      //const ContourSequence = AnnotationToPointData.convert(
      //  annotation,
      //  index,
      //  metadataProvider,
      //  options
      //);
      const roiContour = {
        ROIDisplayColor: [255, 0, 0],
        ContourSequence: contour.contourSequence,
        ReferencedROINumber: index + 1,
      };

      dataset.StructureSetROISequence.push(
        getStructureSetModule(contour, index, metadataProvider)
      );

      dataset.ROIContourSequence.push(roiContour);
      //dataset.RTROIObservationsSequence.push(
      //  getRTROIObservationsSequence(annotation, index, metadataProvider)
      //);

      // ReferencedSeriesSequence
      // Todo: handle more than one series
      dataset.ReferencedSeriesSequence = getReferencedSeriesSequence(
        contour,
        index,
        metadataProvider
      );

      // ReferencedFrameOfReferenceSequence
      dataset.ReferencedFrameOfReferenceSequence = getReferencedFrameOfReferenceSequence(
        contour,
        metadataProvider,
        dataset
      );
    });

    const fileMetaInformationVersionArray = new Uint8Array(2);
    fileMetaInformationVersionArray[1] = 1;

    const _meta = {
      FileMetaInformationVersion: {
        Value: [fileMetaInformationVersionArray.buffer],
        vr: 'OB',
      },
      TransferSyntaxUID: {
        Value: ['1.2.840.10008.1.2.1'],
        vr: 'UI',
      },
      ImplementationClassUID: {
        Value: [DicomMetaDictionary.uid()], // TODO: could be git hash or other valid id
        vr: 'UI',
      },
      ImplementationVersionName: {
        Value: ['dcmjs'],
        vr: 'SH',
      },
    };

    dataset._meta = _meta;

    return dataset;
  }

  /**
   * Generate Cornerstone tool state from dataset
   * @param {object} dataset dataset
   * @param {object} hooks
   * @param {function} hooks.getToolClass Function to map dataset to a tool class
   * @returns
   */
  static generateToolState(dataset, hooks = {}) {
    // Todo
    console.warn('RTSSReport.generateToolState not implemented');
  }
}

function initializeDataset(metadata, metadataProvider) {
  const rtSOPInstanceUID = DicomMetaDictionary.uid();

  // get the first annotation data
  const { referencedImageId: imageId, FrameOfReferenceUID } = metadata;
  console.log(imageId);

  const { studyInstanceUID } = metadataProvider.get(
    'generalSeriesModule',
    imageId
  );

  const patientModule = getPatientModule(imageId, metadataProvider);
  const rtSeriesModule = getRTSeriesModule(imageId, metadataProvider);

  return {
    StructureSetROISequence: [],
    ROIContourSequence: [],
    RTROIObservationsSequence: [],
    ReferencedSeriesSequence: [],
    ReferencedFrameOfReferenceSequence: [],
    ...patientModule,
    ...rtSeriesModule,
    StudyInstanceUID: studyInstanceUID,
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.481.3', // RT Structure Set Storage
    SOPInstanceUID: rtSOPInstanceUID,
    Manufacturer: 'dcmjs',
    Modality: 'RTSTRUCT',
    FrameOfReferenceUID,
    PositionReferenceIndicator: '',
    StructureSetLabel: '',
    StructureSetName: '',
    ReferringPhysicianName: '',
    OperatorsName: '',
    StructureSetDate: DicomMetaDictionary.date(),
    StructureSetTime: DicomMetaDictionary.time(),
  };
}

function getPatientModule(imageId, metadataProvider) {
  const generalSeriesModule = metadataProvider.get(
    'generalSeriesModule',
    imageId
  );
  const generalStudyModule = metadataProvider.get(
    'generalStudyModule',
    imageId
  );
  const patientStudyModule = metadataProvider.get(
    'patientStudyModule',
    imageId
  );
  const patientModule = metadataProvider.get('patientModule', imageId);
  const patientDemographicModule = metadataProvider.get(
    'patientDemographicModule',
    imageId
  );

  return {
    Modality: generalSeriesModule.modality,
    PatientID: patientModule.patientId,
    PatientName: patientModule.patientName,
    PatientBirthDate: '',
    PatientAge: patientStudyModule.patientAge,
    PatientSex: patientDemographicModule.patientSex,
    PatientWeight: patientStudyModule.patientWeight,
    StudyDate: generalStudyModule.studyDate,
    StudyTime: generalStudyModule.studyTime,
    StudyID: 'ToDo',
    AccessionNumber: generalStudyModule.accessionNumber,
  };
}

function getReferencedFrameOfReferenceSequence(
  contour,
  metadataProvider,
  dataset
) {
  const { referencedImageId: imageId, FrameOfReferenceUID } = contour.metadata;
  const instance = metadataProvider.get('instance', imageId);
  const { SeriesInstanceUID } = instance;

  const { ReferencedSeriesSequence } = dataset;

  return [
    {
      FrameOfReferenceUID,
      RTReferencedStudySequence: [
        {
          ReferencedSOPClassUID: dataset.SOPClassUID,
          ReferencedSOPInstanceUID: dataset.SOPInstanceUID,
          RTReferencedSeriesSequence: [
            {
              SeriesInstanceUID,
              ContourImageSequence: [
                ...ReferencedSeriesSequence[0].ReferencedInstanceSequence,
              ],
            },
          ],
        },
      ],
    },
  ];
}

function getReferencedSeriesSequence(contour, index, metadataProvider) {
  // grab imageId from toolData
  const { referencedImageId: imageId } = contour.metadata;
  const instance = metadataProvider.get('instance', imageId);
  const { SeriesInstanceUID, StudyInstanceUID } = instance;

  const ReferencedSeriesSequence = [];
  if (SeriesInstanceUID) {
    const series = DicomMetadataStore.getSeries(
      StudyInstanceUID,
      SeriesInstanceUID
    );

    const ReferencedSeries = {
      SeriesInstanceUID,
      ReferencedInstanceSequence: [],
    };

    series.instances.forEach(instance => {
      const { SOPInstanceUID, SOPClassUID } = instance;
      ReferencedSeries.ReferencedInstanceSequence.push({
        ReferencedSOPClassUID: SOPClassUID,
        ReferencedSOPInstanceUID: SOPInstanceUID,
      });
    });

    ReferencedSeriesSequence.push(ReferencedSeries);
  }

  return ReferencedSeriesSequence;
}

function getRTSeriesModule(imageId, metadataProvider) {
  return {
    SeriesInstanceUID: DicomMetaDictionary.uid(), // generate a new series instance uid
    SeriesNumber: '99', // Todo:: what should be the series number?
  };
}

function getStructureSetModule(contour, index, metadataProvider) {
  const { FrameOfReferenceUID } = contour.metadata;

  return {
    ROINumber: index + 1,
    ROIName: contour.name || `Todo: name ${index + 1}`,
    ROIDescription: `Todo: description ${index + 1}`,
    ROIGenerationAlgorithm: 'Todo: algorithm',
    ReferencedFrameOfReferenceUID: FrameOfReferenceUID,
  };
}

function getRTROIObservationsSequence(toolData, index, metadataProvider) {
  return {
    ObservationNumber: index + 1,
    ReferencedROINumber: index + 1,
    RTROIInterpretedType: 'Todo: type',
    ROIInterpreter: 'Todo: interpreter',
  };
}
