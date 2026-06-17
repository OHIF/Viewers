import sameAttributeAsDisplaySet from './sameAttributeAsDisplaySet';

const context = {
  attributeName: 'Modality',
  displaySetSelectorId: 'currentDisplaySetId',
};

describe('sameAttributeAsDisplaySet', () => {
  it('returns true when candidate matches the selected display set attribute', () => {
    const result = sameAttributeAsDisplaySet.call(
      context,
      { displaySetInstanceUID: 'prior-cr', Modality: 'CR' },
      {
        displaySetMatchDetails: new Map([
          ['currentDisplaySetId', { displaySetInstanceUID: 'current-cr' }],
        ]),
        displaySets: [{ displaySetInstanceUID: 'current-cr', Modality: 'CR' }],
      }
    );

    expect(result).toBe(true);
  });

  it('returns false when candidate does not match the selected display set attribute', () => {
    const result = sameAttributeAsDisplaySet.call(
      context,
      { displaySetInstanceUID: 'prior-ct', Modality: 'CT' },
      {
        displaySetMatchDetails: new Map([
          ['currentDisplaySetId', { displaySetInstanceUID: 'current-cr' }],
        ]),
        displaySets: [{ displaySetInstanceUID: 'current-cr', Modality: 'CR' }],
      }
    );

    expect(result).toBe(false);
  });

  it('returns false when there is no current display set match yet', () => {
    const result = sameAttributeAsDisplaySet.call(
      context,
      { displaySetInstanceUID: 'prior-cr', Modality: 'CR' },
      {
        displaySetMatchDetails: new Map(),
        displaySets: [{ displaySetInstanceUID: 'current-cr', Modality: 'CR' }],
      }
    );

    expect(result).toBe(false);
  });
});
