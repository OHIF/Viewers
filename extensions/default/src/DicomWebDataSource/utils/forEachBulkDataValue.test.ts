import dcmjs from '@dcmjs-org/dcmjs';
import { forEachBulkDataValue } from './forEachBulkDataValue';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

describe('forEachBulkDataValue', () => {
  it('finds the bulk data in one-item sequences and private blocks', () => {
    // DICOMweb JSON as a server sends it with bulk data enabled.
    const naturalized = naturalizeDataset({
      '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] },
      '7FE00010': { vr: 'OB', BulkDataURI: 'bulk/pixel' },
      '54000100': { vr: 'SQ', Value: [{ '54001010': { vr: 'OW', BulkDataURI: 'bulk/wave' } }] },
      '30060039': {
        vr: 'SQ',
        Value: [
          {
            '30060040': {
              vr: 'SQ',
              Value: [
                { '30060050': { vr: 'DS', BulkDataURI: 'bulk/contour1' } },
                { '30060050': { vr: 'DS', BulkDataURI: 'bulk/contour2' } },
              ],
            },
          },
        ],
      },
      '70530010': { vr: 'LO', Value: ['Philips PET Private Group'] },
      '70531000': { vr: 'DS', BulkDataURI: 'bulk/suv' },
    });

    const found = [];
    forEachBulkDataValue(naturalized, value => found.push(value.BulkDataURI));

    expect(found.sort()).toEqual([
      'bulk/contour1',
      'bulk/contour2',
      'bulk/pixel',
      'bulk/suv',
      'bulk/wave',
    ]);
  });
});
