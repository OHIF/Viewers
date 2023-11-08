/*
 * This script uses nodejs to generate a JSON file from a DICOM study folder.
 * You need to have dcmjs installed in your project.
 * The JSON file will can be used to load the study into the OHIF Viewer. You can get more detail
 * in the DICOM JSON Data source on docs.ohif.org
 */
const dcmjs = require('dcmjs');
var path = require('path');
var fs = require('fs');

var args = process.argv.slice(2);

const [studyDirectory, urlPrefix, outputPath] = args;

if (args.length !== 3) {
  console.log(
    'expecting --- node dicomStudyToJSONLaunch.js /path/to/study/folder url-prefix-string /path/to/save/JSON'
  );
  return;
}

const _model = {
  studies: [],
};

function _getStudy(StudyInstanceUID) {
  return _model.studies.find(aStudy => aStudy.StudyInstanceUID === StudyInstanceUID);
}

function _getSeries(StudyInstanceUID, SeriesInstanceUID) {
  const study = _getStudy(StudyInstanceUID);

  if (!study) {
    return;
  }

  return study.series.find(aSeries => aSeries.SeriesInstanceUID === SeriesInstanceUID);
}

function createStudyMetadata(StudyInstanceUID, instance) {
  const {
    StudyDescription,
    StudyDate,
    StudyTime,
    PatientName,
    PatientID,
    AccessionNumber,
    PatientAge,
    PatientSex,
    PatientWeight,
  } = instance;
  return {
    StudyInstanceUID,
    StudyDescription,
    StudyDate,
    StudyTime,
    PatientName,
    PatientID: PatientID || '1234', // this is critical to have
    AccessionNumber,
    PatientAge,
    PatientSex,
    PatientWeight,
    series: [],
  };
}
function createSeriesMetadata(instance) {
  const {
    SeriesInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesTime,
    Modality,
    SliceThickness,
  } = instance;

  return {
    SeriesInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesTime,
    Modality,
    SliceThickness,
    instances: [],
  };
}
function createInstanceMetaData(instance) {
  const {
    Columns,
    Rows,
    InstanceNumber,
    SOPClassUID,
    AcquisitionNumber,
    PhotometricInterpretation,
    BitsAllocated,
    BitsStored,
    PixelRepresentation,
    SamplesPerPixel,
    PixelSpacing,
    HighBit,
    ImageOrientationPatient,
    ImagePositionPatient,
    FrameOfReferenceUID,
    ImageType,
    Modality,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SeriesDate,
    ConceptNameCodeSequence,
    WindowCenter,
    WindowWidth,
    RescaleIntercept,
    RescaleSlope,
    ReferencedSeriesSequence,
    SharedFunctionalGroupsSequence,
    PerFrameFunctionalGroupsSequence,
    ContentSequence,
    ContentTemplateSequence,
    CurrentRequestedProcedureEvidenceSequence,
    CodingSchemeIdentificationSequence,
    RadiopharmaceuticalInformationSequence,
    CorrectedImage,
    Units,
    DecayCorrection,
    AcquisitionDate,
    AcquisitionTime,
    PatientWeight,
  } = instance;
  return {
    metadata: {
      Columns,
      Rows,
      InstanceNumber,
      SOPClassUID,
      AcquisitionNumber,
      PhotometricInterpretation,
      BitsAllocated,
      BitsStored,
      PixelRepresentation,
      SamplesPerPixel,
      PixelSpacing,
      HighBit,
      ImageOrientationPatient,
      ImagePositionPatient,
      FrameOfReferenceUID,
      ImageType,
      Modality,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
      WindowCenter,
      WindowWidth,
      RescaleIntercept,
      RescaleSlope,
      ConceptNameCodeSequence: ConceptNameCodeSequence || undefined,
      SeriesDate: SeriesDate || undefined,
      ...(ConceptNameCodeSequence !== undefined && {
        ConceptNameCodeSequence,
      }),
      ...(ReferencedSeriesSequence !== undefined && {
        ReferencedSeriesSequence,
      }),
      ...(SharedFunctionalGroupsSequence !== undefined && {
        SharedFunctionalGroupsSequence,
      }),
      ...(PerFrameFunctionalGroupsSequence !== undefined && {
        PerFrameFunctionalGroupsSequence,
      }),
      ...(ContentSequence !== undefined && {
        ContentSequence,
      }),
      ...(ContentTemplateSequence !== undefined && {
        ContentTemplateSequence,
      }),
      ...(CurrentRequestedProcedureEvidenceSequence !== undefined && {
        CurrentRequestedProcedureEvidenceSequence,
      }),
      ...(CodingSchemeIdentificationSequence !== undefined && {
        CodingSchemeIdentificationSequence,
      }),
      ...(RadiopharmaceuticalInformationSequence !== undefined && {
        RadiopharmaceuticalInformationSequence: [RadiopharmaceuticalInformationSequence],
      }),
      ...(CorrectedImage !== undefined && {
        CorrectedImage,
      }),
      ...(Units !== undefined && {
        Units,
      }),
      ...(DecayCorrection !== undefined && {
        DecayCorrection,
      }),
      ...(AcquisitionDate !== undefined && {
        AcquisitionDate,
      }),
      ...(AcquisitionTime !== undefined && {
        AcquisitionTime,
      }),
      ...(PatientWeight !== undefined && {
        PatientWeight,
      }),
    },
    url: instance.fileLocation,
  };
}
function createInstanceMetaDataMultiFrame(instance) {
  const instances = [];

  const {
    Columns,
    Rows,
    InstanceNumber,
    SOPClassUID,
    AcquisitionNumber,
    PhotometricInterpretation,
    BitsAllocated,
    BitsStored,
    PixelRepresentation,
    SamplesPerPixel,
    PixelSpacing,
    HighBit,
    ImageOrientationPatient,
    ImagePositionPatient,
    FrameOfReferenceUID,
    ImageType,
    Modality,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SeriesDate,
    ConceptNameCodeSequence,
    WindowCenter,
    WindowWidth,
    ReferencedSeriesSequence,
    SharedFunctionalGroupsSequence,
    PerFrameFunctionalGroupsSequence,
    ContentSequence,
    ContentTemplateSequence,
    CurrentRequestedProcedureEvidenceSequence,
    CodingSchemeIdentificationSequence,
    RadiopharmaceuticalInformationSequence,
    CorrectedImage,
    Units,
    DecayCorrection,
    AcquisitionDate,
    AcquisitionTime,
    PatientWeight,
    RescaleIntercept,
    RescaleSlope,
  } = instance;

  for (let i = 1; i < instance.NumberOfFrames; i++) {
    const result = {
      metadata: {
        Columns,
        Rows,
        InstanceNumber,
        SOPClassUID,
        AcquisitionNumber,
        PhotometricInterpretation,
        BitsAllocated,
        BitsStored,
        PixelRepresentation,
        SamplesPerPixel,
        PixelSpacing,
        HighBit,
        ImageOrientationPatient,
        ImagePositionPatient,
        FrameOfReferenceUID,
        ImageType,
        Modality,
        SOPInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
        WindowCenter,
        WindowWidth,
        SeriesDate,
        RescaleIntercept,
        RescaleSlope,
        ...(ConceptNameCodeSequence !== undefined && {
          ConceptNameCodeSequence,
        }),
        ...(ReferencedSeriesSequence !== undefined && {
          ReferencedSeriesSequence,
        }),
        ...(SharedFunctionalGroupsSequence !== undefined && {
          SharedFunctionalGroupsSequence,
        }),
        ...(PerFrameFunctionalGroupsSequence !== undefined && {
          PerFrameFunctionalGroupsSequence,
        }),
        ...(ContentSequence !== undefined && {
          ContentSequence,
        }),
        ...(ContentTemplateSequence !== undefined && {
          ContentTemplateSequence,
        }),
        ...(CurrentRequestedProcedureEvidenceSequence !== undefined && {
          CurrentRequestedProcedureEvidenceSequence,
        }),
        ...(CodingSchemeIdentificationSequence !== undefined && {
          CodingSchemeIdentificationSequence,
        }),
        ...(RadiopharmaceuticalInformationSequence !== undefined && {
          RadiopharmaceuticalInformationSequence: [RadiopharmaceuticalInformationSequence],
        }),
        ...(CorrectedImage !== undefined && {
          CorrectedImage,
        }),
        ...(Units !== undefined && {
          Units,
        }),
        ...(DecayCorrection !== undefined && {
          DecayCorrection,
        }),
        ...(AcquisitionDate !== undefined && {
          AcquisitionDate,
        }),
        ...(AcquisitionTime !== undefined && {
          AcquisitionTime,
        }),
        ...(PatientWeight !== undefined && {
          PatientWeight,
        }),
      },
      url: instance.fileLocation + `?frame=${i}`,
    };
    instances.push(result);
  }
  return instances;
}

// https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
const walk = function (dir, done) {
  let results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

const craeteImageId = fileLocation => {
  return 'dicomweb:' + urlPrefix + fileLocation.replace(studyDirectory, '');
};

const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
};

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
  return modalities;
};

walk(studyDirectory, function (err, files) {
  if (err) throw err;
  // check other file types li
  console.debug('Processing...');
  files.forEach(file => {
    if (!file.includes('.DS_Store') && !file.includes('.xml')) {
      var arrayBuffer = fs.readFileSync(file).buffer;
      let DicomDict = dcmjs.data.DicomMessage.readFile(arrayBuffer);
      const instance = dcmjs.data.DicomMetaDictionary.naturalizeDataset(DicomDict.dict);

      instance.fileLocation = craeteImageId(file);
      const { StudyInstanceUID, SeriesInstanceUID } = instance;
      let study = _getStudy(StudyInstanceUID);

      if (!study) {
        _model.studies.push(createStudyMetadata(StudyInstanceUID, instance));

        study = _model.studies[_model.studies.length - 1];
      }

      let series = _getSeries(StudyInstanceUID, SeriesInstanceUID);

      if (!series) {
        study.series.push(createSeriesMetadata(instance));

        series = study.series[study.series.length - 1];
      }
      if (instance.NumberOfFrames > 1) {
        const instanceMetaData = createInstanceMetaDataMultiFrame(instance);
        series.instances.push(...instanceMetaData);
      } else {
        const instanceMetaData = createInstanceMetaData(instance);
        series.instances.push(instanceMetaData);
      }
    }
  });
  console.log('Successfully loaded data');
  _model.studies.forEach(aStudy => {
    const numInstances = findInstancesNumber(aStudy);
    aStudy.NumInstances = numInstances;
  });

  _model.studies.forEach(aStudy => {
    const modalities = findModalities(aStudy);
    aStudy.Modalities = Array.from(modalities).join('/');
  });
  storeData(_model, outputPath);
  console.log('JSON saved');
});
