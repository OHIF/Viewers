/*
 * This script uses nodejs to generate a JSON file from a DICOM study folder.
 * You need to have dcmjs installed in your project.
 * The JSON file can be used to load the study into the OHIF Viewer. You can get more detail
 * in the DICOM JSON Data source on docs.ohif.org
 *
 * Usage: node dicomStudyToJSONLaunch.js <studyFolder> <urlPrefix> <outputJSONPath>
 *
 * params:
 * - studyFolder: path to the study folder
 * - urlPrefix: prefix to the url that will be used to load the study into the viewer. For instance
 *   we use https://ohif-assets.s3.us-east-2.amazonaws.com/dicom-json/data as the urlPrefix for the
 *   example since the data is hosted on S3 and each study is in a folder. So the url in the generated
 *   json file for the first instance of the first series of the first study will be
 *   dicomweb:https://ohif-assets.s3.us-east-2.amazonaws.com/dicom-json/data/Series1/Instance1
 * - outputJSONPath: path to the output JSON file
 */
const dcmjs = require('dcmjs');
const path = require('path');
const fs = require('fs').promises;

const args = process.argv.slice(2);
const [studyDirectory, urlPrefix, outputPath] = args;

if (args.length !== 3) {
  console.error('Usage: node dicomStudyToJSONLaunch.js <studyFolder> <urlPrefix> <outputJSONPath>');
  process.exit(1);
}

const model = {
  studies: [],
};

async function convertDICOMToJSON(studyDirectory, urlPrefix, outputPath) {
  try {
    const files = await recursiveReadDir(studyDirectory);
    console.debug('Processing...');

    for (const file of files) {
      if (!file.includes('.DS_Store') && !file.includes('.xml')) {
        const arrayBuffer = await fs.readFile(file);
        const dicomDict = dcmjs.data.DicomMessage.readFile(arrayBuffer.buffer);
        const instance = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomDict.dict);

        instance.fileLocation = createImageId(file, urlPrefix, studyDirectory);
        processInstance(instance);
      }
    }

    console.log('Successfully loaded data');

    model.studies.forEach(study => {
      study.NumInstances = findInstancesNumber(study);
      study.Modalities = findModalities(study).join('/');
    });

    await fs.writeFile(outputPath, JSON.stringify(model, null, 2));
    console.log('JSON saved');
  } catch (error) {
    console.error(error);
  }
}

async function recursiveReadDir(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.resolve(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const res = await recursiveReadDir(filePath);
      results = results.concat(res);
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function createImageId(fileLocation, urlPrefix, studyDirectory) {
  const relativePath = path.relative(studyDirectory, fileLocation);
  const normalizedPath = path.normalize(relativePath).replace(/\\/g, '/');
  return `dicomweb:${urlPrefix}${normalizedPath}`;
}

function processInstance(instance) {
  const { StudyInstanceUID, SeriesInstanceUID } = instance;
  let study = getStudy(StudyInstanceUID);

  if (!study) {
    study = createStudyMetadata(StudyInstanceUID, instance);
    model.studies.push(study);
  }

  let series = getSeries(StudyInstanceUID, SeriesInstanceUID);

  if (!series) {
    series = createSeriesMetadata(instance);
    study.series.push(series);
  }

  const instanceMetaData =
    instance.NumberOfFrames > 1
      ? createInstanceMetaDataMultiFrame(instance)
      : createInstanceMetaData(instance);

  series.instances.push(...[].concat(instanceMetaData));
}

function getStudy(StudyInstanceUID) {
  return model.studies.find(study => study.StudyInstanceUID === StudyInstanceUID);
}

function getSeries(StudyInstanceUID, SeriesInstanceUID) {
  const study = getStudy(StudyInstanceUID);
  return study
    ? study.series.find(series => series.SeriesInstanceUID === SeriesInstanceUID)
    : undefined;
}

const findInstancesNumber = study => {
  let numInstances = 0;
  study.series.forEach(aSeries => {
    numInstances = numInstances + aSeries.instances.length;
  });
  return numInstances;
};

const findModalities = study => {
  let modalities = new Set();
  study.series.forEach(aSeries => {
    modalities.add(aSeries.Modality);
  });
  return Array.from(modalities);
};

function createStudyMetadata(StudyInstanceUID, instance) {
  return {
    StudyInstanceUID,
    StudyDescription: instance.StudyDescription,
    StudyDate: instance.StudyDate,
    StudyTime: instance.StudyTime,
    PatientName: instance.PatientName,
    PatientID: instance.PatientID || '1234', // this is critical to have
    AccessionNumber: instance.AccessionNumber,
    PatientAge: instance.PatientAge,
    PatientSex: instance.PatientSex,
    PatientWeight: instance.PatientWeight,
    series: [],
  };
}
function createSeriesMetadata(instance) {
  return {
    SeriesInstanceUID: instance.SeriesInstanceUID,
    SeriesDescription: instance.SeriesDescription,
    SeriesNumber: instance.SeriesNumber,
    SeriesTime: instance.SeriesTime,
    Modality: instance.Modality,
    SliceThickness: instance.SliceThickness,
    instances: [],
  };
}
function commonMetaData(instance) {
  return {
    Columns: instance.Columns,
    Rows: instance.Rows,
    InstanceNumber: instance.InstanceNumber,
    SOPClassUID: instance.SOPClassUID,
    AcquisitionNumber: instance.AcquisitionNumber,
    PhotometricInterpretation: instance.PhotometricInterpretation,
    BitsAllocated: instance.BitsAllocated,
    BitsStored: instance.BitsStored,
    PixelRepresentation: instance.PixelRepresentation,
    SamplesPerPixel: instance.SamplesPerPixel,
    PixelSpacing: instance.PixelSpacing,
    HighBit: instance.HighBit,
    ImageOrientationPatient: instance.ImageOrientationPatient,
    ImagePositionPatient: instance.ImagePositionPatient,
    FrameOfReferenceUID: instance.FrameOfReferenceUID,
    ImageType: instance.ImageType,
    Modality: instance.Modality,
    SOPInstanceUID: instance.SOPInstanceUID,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    WindowCenter: instance.WindowCenter,
    WindowWidth: instance.WindowWidth,
    RescaleIntercept: instance.RescaleIntercept,
    RescaleSlope: instance.RescaleSlope,
  };
}

function conditionalMetaData(instance) {
  return {
    ...(instance.ConceptNameCodeSequence && {
      ConceptNameCodeSequence: instance.ConceptNameCodeSequence,
    }),
    ...(instance.SeriesDate && { SeriesDate: instance.SeriesDate }),
    ...(instance.ReferencedSeriesSequence && {
      ReferencedSeriesSequence: instance.ReferencedSeriesSequence,
    }),
    ...(instance.SharedFunctionalGroupsSequence && {
      SharedFunctionalGroupsSequence: instance.SharedFunctionalGroupsSequence,
    }),
    ...(instance.PerFrameFunctionalGroupsSequence && {
      PerFrameFunctionalGroupsSequence: instance.PerFrameFunctionalGroupsSequence,
    }),
    ...(instance.ContentSequence && { ContentSequence: instance.ContentSequence }),
    ...(instance.ContentTemplateSequence && {
      ContentTemplateSequence: instance.ContentTemplateSequence,
    }),
    ...(instance.CurrentRequestedProcedureEvidenceSequence && {
      CurrentRequestedProcedureEvidenceSequence: instance.CurrentRequestedProcedureEvidenceSequence,
    }),
    ...(instance.CodingSchemeIdentificationSequence && {
      CodingSchemeIdentificationSequence: instance.CodingSchemeIdentificationSequence,
    }),
    ...(instance.RadiopharmaceuticalInformationSequence && {
      RadiopharmaceuticalInformationSequence: instance.RadiopharmaceuticalInformationSequence,
    }),
    ...(instance.ROIContourSequence && {
      ROIContourSequence: instance.ROIContourSequence,
    }),
    ...(instance.StructureSetROISequence && {
      StructureSetROISequence: instance.StructureSetROISequence,
    }),
    ...(instance.ReferencedFrameOfReferenceSequence && {
      ReferencedFrameOfReferenceSequence: instance.ReferencedFrameOfReferenceSequence,
    }),
    ...(instance.CorrectedImage && { CorrectedImage: instance.CorrectedImage }),
    ...(instance.Units && { Units: instance.Units }),
    ...(instance.DecayCorrection && { DecayCorrection: instance.DecayCorrection }),
    ...(instance.AcquisitionDate && { AcquisitionDate: instance.AcquisitionDate }),
    ...(instance.AcquisitionTime && { AcquisitionTime: instance.AcquisitionTime }),
    ...(instance.PatientWeight && { PatientWeight: instance.PatientWeight }),
    ...(instance.NumberOfFrames && { NumberOfFrames: instance.NumberOfFrames }),
    ...(instance.FrameTime && { FrameTime: instance.FrameTime }),
    ...(instance.EncapsulatedDocument && { EncapsulatedDocument: instance.EncapsulatedDocument }),
    ...(instance.SequenceOfUltrasoundRegions && {
      SequenceOfUltrasoundRegions: instance.SequenceOfUltrasoundRegions,
    }),
  };
}

function createInstanceMetaData(instance) {
  const metadata = {
    ...commonMetaData(instance),
    ...conditionalMetaData(instance),
  };
  return { metadata, url: instance.fileLocation };
}

function createInstanceMetaDataMultiFrame(instance) {
  const instances = [];
  const commonData = commonMetaData(instance);
  const conditionalData = conditionalMetaData(instance);

  for (let i = 1; i <= instance.NumberOfFrames; i++) {
    const metadata = { ...commonData, ...conditionalData };
    const result = { metadata, url: instance.fileLocation + `?frame=${i}` };
    instances.push(result);
  }
  return instances;
}

convertDICOMToJSON(studyDirectory, urlPrefix, outputPath);
