import dcmjs from '@dcmjs-org/dcmjs';
import getDatasetKeys from './getDatasetKeys';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

describe('getDatasetKeys', () => {
  it('lists the hex tags of a private block, and reads their values', () => {
    const metadata = naturalizeDataset({
      '00100020': { vr: 'LO', Value: ['PID'] },
      '00290010': { vr: 'LO', Value: ['ACME'] },
      '002910A1': { vr: 'LO', Value: ['private'] },
    });

    const keys = getDatasetKeys(metadata);

    expect(keys).toEqual(expect.arrayContaining(['PatientID', '00290010', '002910A1']));
    expect(keys.some(key => key.includes(':'))).toBe(false);
    expect(metadata['00290010']).toBe('ACME');
    expect(metadata['002910A1']).toEqual(['private']);
  });
});
