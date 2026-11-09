import dcmjs from '@dcmjs-org/dcmjs';
import getDatasetEntries from './getDatasetEntries';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

describe('getDatasetEntries', () => {
  it('lists the hex tags of a private block with their values, also for a JSON copy', () => {
    const metadata = JSON.parse(
      JSON.stringify(
        naturalizeDataset({
          '00100020': { vr: 'LO', Value: ['PID'] },
          '00290010': { vr: 'LO', Value: ['ACME'] },
          '002910A1': { vr: 'LO', Value: ['private'] },
        })
      )
    );

    const entries = Object.fromEntries(getDatasetEntries(metadata));

    expect(Object.keys(entries).some(key => key.includes(':'))).toBe(false);
    expect(entries).toMatchObject({
      PatientID: 'PID',
      '00290010': 'ACME',
      '002910A1': ['private'],
    });
  });
});
