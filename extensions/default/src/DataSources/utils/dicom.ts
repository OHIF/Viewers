/**
 * Basic imports from dcmjs.
 */

import dcmjs from 'dcmjs';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

export {DicomMetaDictionary, DicomDict, naturalizeDataset, denaturalizeDataset};
