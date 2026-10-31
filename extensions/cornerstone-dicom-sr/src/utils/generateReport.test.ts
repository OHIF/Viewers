import { metaData } from '@cornerstonejs/core';
import generateReport from './generateReport';

const imageId = 'wadors:/studies/1/series/2/instances/3/frames/1';

jest.mock('@cornerstonejs/adapters/version', () => ({ version: '9.9.9' }));
jest.mock('./getFilteredCornerstoneToolState', () => () => ({ [imageId]: {} }));

describe('generateReport', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.VERSION_NUMBER = '3.14.0';
    jest.spyOn(metaData, 'get').mockImplementation(type => {
      if (type === 'sopCommonModule') {
        return { sopInstanceUID: '1.2.3', sopClassUID: '1.2.840.10008.5.1.4.1.1.2' };
      }
      if (type === 'instance') {
        return { StudyInstanceUID: '1', SeriesInstanceUID: '2', SOPInstanceUID: '1.2.3' };
      }
    });
  });

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  it('names OHIF and the CS3D adapters as the writer of the SR', () => {
    const dataset = generateReport([], []);

    expect(dataset).toMatchObject({
      Manufacturer: 'OHIF',
      ManufacturerModelName: '@cornerstonejs/adapters',
      SoftwareVersions: ['OHIF 3.14.0', 'CS3D 9.9.9'],
    });
  });

  it('keeps a writer value that the caller gives', () => {
    const dataset = generateReport([], [], { Manufacturer: 'Site viewer' });

    expect(dataset.Manufacturer).toBe('Site viewer');
  });

  it('keeps the OHIF value for an empty caller value', () => {
    const dataset = generateReport([], [], { Manufacturer: '' });

    expect(dataset.Manufacturer).toBe('OHIF');
  });
});
