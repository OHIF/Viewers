import findDisplaySetByUID from './findDisplaySetByUID';

describe('findDisplaySetByUID', () => {
  test('returns null when studyMetadata isnt an array', () => {
    const result = findDisplaySetByUID(undefined, 'hello');
    expect(result).toBeNull();
  });

  test('returns null when no match found', () => {
    const result = findDisplaySetByUID([], 'no-match');
    expect(result).toBeNull();
  });

  test('it handles missing displaySet arrays', () => {
    const expected = '9388-2291-a8fe';
    const studyMetadata = [
      { displaySets: null },
      {
        displaySets: [{ displaySetInstanceUID: expected }],
      },
      null,
      7,
    ];
    const result = findDisplaySetByUID(studyMetadata, expected);
    expect(result.displaySetInstanceUID).toBe(expected);
  });

  test('returns correct displaySet by UID', () => {
    const expected = '1234-5678';
    const studyMetadata = [
      { displaySets: [{ displaySetInstanceUID: '0011-2239' }] },
      {
        displaySets: [
          { displaySetInstanceUID: '0392-2211' },
          { displaySetInstanceUID: expected },
        ],
      },
      { displaySets: [{ displaySetInstanceUID: '3384-9933' }] },
    ];
    const result = findDisplaySetByUID(studyMetadata, expected);
    expect(result.displaySetInstanceUID).toBe(expected);
  });
});
