import dcmjs from '@dcmjs-org/dcmjs';
import formatContentItemValue from './formatContentItem';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

describe('formatContentItemValue', () => {
  it('shows the name of a PNAME content item that dcmjs naturalized', () => {
    const contentItem = naturalizeDataset({
      '0040A040': { vr: 'CS', Value: ['PNAME'] },
      '0040A123': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] },
    });

    expect(formatContentItemValue(contentItem)).toBe('Doe, John');
  });
});
