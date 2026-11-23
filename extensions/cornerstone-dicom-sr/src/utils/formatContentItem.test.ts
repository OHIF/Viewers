import formatContentItemValue from './formatContentItem';

describe('formatContentItemValue IMAGE', () => {
  const imageItem = {
    ValueType: 'IMAGE',
    RelationshipType: 'CONTAINS',
    ReferencedSOPSequence: [{ ReferencedSOPInstanceUID: '1.2.3.4' }],
  };

  const displaySetService = {
    getActiveDisplaySets: () => [
      { instances: [{ SOPInstanceUID: '9.9.9', SeriesNumber: 2, InstanceNumber: 1 }] },
      {
        instances: [
          { SOPInstanceUID: '1.2.3.4', SeriesNumber: 1, InstanceNumber: 0, NumberOfFrames: 12 },
        ],
      },
    ],
  };

  it('names the referenced image by series and instance number', () => {
    expect(formatContentItemValue(imageItem, displaySetService)).toBe(
      'Series 1, image 0, 12 frames'
    );
  });

  it('says so when the referenced image is not loaded', () => {
    expect(formatContentItemValue(imageItem, { getActiveDisplaySets: () => [] })).toBe(
      '[referenced image not loaded]'
    );
  });
});
