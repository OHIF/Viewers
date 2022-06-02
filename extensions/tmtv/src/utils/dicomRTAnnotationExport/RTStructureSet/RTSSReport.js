import AnnotationToPointData from './measurements/AnnotationToPointData';
import dcmjs from 'dcmjs';
import { DicomMetadataStore } from '@ohif/core';

const { DicomMetaDictionary } = dcmjs.data;

export default class RTSSReport {
  constructor() {}

  /**
   * Convert handles to RTSSReport report object containing the dcmjs dicom dataset.
   *
   * Note: The tool data needs to be formatted in a specific way, and currently
   * it is limited to the RectangleROIStartEndTool in the Cornerstone.
   *
   * @param annotations Array of Cornerstone tool annotation data
   * @param metadataProvider Metadata provider
   * @param options report generation options
   * @returns Report object containing the dataset
   */
  static generateReport(annotations, metadataProvider, options) {
    let dataset = initializeDataset(annotations, metadataProvider);

    annotations.forEach((annotation, index) => {
      const ContourSequence = AnnotationToPointData.convert(
        annotation,
        index,
        metadataProvider,
        options
      );

      dataset.StructureSetROISequence.push(
        getStructureSetModule(annotation, index, metadataProvider)
      );

      dataset.ROIContourSequence.push(ContourSequence);
      dataset.RTROIObservationsSequence.push(
        getRTROIObservationsSequence(annotation, index, metadataProvider)
      );

      // ReferencedSeriesSequence
      // Todo: handle more than one series
      dataset.ReferencedSeriesSequence = getReferencedSeriesSequence(
        annotation,
        index,
        metadataProvider
      );

      // ReferencedFrameOfReferenceSequence
      dataset.ReferencedFrameOfReferenceSequence = getReferencedFrameOfReferenceSequence(
        annotation,
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

function initializeDataset(annotations, metadataProvider) {
  const rtSOPInstanceUID = DicomMetaDictionary.uid();

  // get the first annotation data
  const {
    referencedImageId: imageId,
    FrameOfReferenceUID,
  } = annotations[0].metadata;

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
  toolData,
  metadataProvider,
  dataset
) {
  const { referencedImageId: imageId, FrameOfReferenceUID } = toolData.metadata;
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

function getReferencedSeriesSequence(toolData, index, metadataProvider) {
  // grab imageId from toolData
  const { referencedImageId: imageId } = toolData.metadata;
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

function getStructureSetModule(toolData, index, metadataProvider) {
  const { FrameOfReferenceUID } = toolData.metadata;

  return {
    ROINumber: index + 1,
    ROIName: `Todo: name ${index + 1}`,
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
