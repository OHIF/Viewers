import dcmjs from '@dcmjs-org/dcmjs';
import { fixMultiValueKeys } from './fixMultiValueKeys';

const { naturalizeDataset, denaturalizeDataset } = dcmjs.data.DicomMetaDictionary;

describe('fixMultiValueKeys', () => {
  it('keeps every ImageType value when the source joins them in one value', () => {
    // A static DICOMweb source writes the ImageType of a WSI as one string.
    const naturalized = naturalizeDataset({
      '00080008': { vr: 'CS', Value: ['ORIGINAL\\PRIMARY\\VOLUME\\NONE'] },
    });
    const json = denaturalizeDataset(fixMultiValueKeys(naturalized));
    expect(json['00080008'].Value).toEqual(['ORIGINAL', 'PRIMARY', 'VOLUME', 'NONE']);
  });
});
