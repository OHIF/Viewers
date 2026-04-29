import dcmjs from 'dcmjs';

export const DICOM_WRITE_OPTIONS = {
  allowInvalidVRLength: false,
  fragmentMultiframe: false,
};

export function datasetToDicomPart10Buffer(dataset) {
  const dicomDict = dcmjs.data.datasetToDict(dataset);
  return dicomDict.write(DICOM_WRITE_OPTIONS);
}

export function datasetToDicomBlob(dataset) {
  const part10Buffer = datasetToDicomPart10Buffer(dataset);
  return new Blob([part10Buffer], { type: 'application/dicom' });
}

export function writeDicomDictToPart10Buffer(dicomDict) {
  return dicomDict.write(DICOM_WRITE_OPTIONS);
}
