import createRenderedRetrieve from './createRenderedRetrieve';

describe('createRenderedRetrieve', () => {
  const config = {
    wadoRoot: 'https://example.com/wado',
  };

  const params = {
    instance: {
      StudyInstanceUID: 'study-uid',
      SeriesInstanceUID: 'series-uid',
      SOPInstanceUID: 'sop-uid',
    },
  };

  it('should return the rendered URL for PixelData tag', () => {
    const result = createRenderedRetrieve(config, {
      ...params,
      tag: 'PixelData',
    });

    expect(result).toBe(
      'https://example.com/wado/studies/study-uid/series/series-uid/instances/sop-uid/rendered'
    );
  });

  it('should return the rendered URL for EncapsulatedDocument tag', () => {
    const result = createRenderedRetrieve(config, {
      ...params,
      tag: 'EncapsulatedDocument',
    });

    expect(result).toBe(
      'https://example.com/wado/studies/study-uid/series/series-uid/instances/sop-uid/rendered'
    );
  });

  it('should return undefined for unknown tag', () => {
    const result = createRenderedRetrieve(config, {
      ...params,
      tag: 'UnknownTag',
    });

    expect(result).toBeUndefined();
  });
});
